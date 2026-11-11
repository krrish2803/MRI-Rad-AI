"""Small reproducible 2D baseline for MSD Task05 prostate zone segmentation.

Trains only on imagesTr/labelsTr. Uses a patient-level 26/6 split; test images
have no public labels and are not used for evaluation.
"""
import csv
import gzip
import json
import os
import random
import struct
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


DATA = Path(os.environ.get("MSD_PROSTATE_DIR", "/private/tmp/msd_prostate/Task05_Prostate"))
OUT = Path(os.environ.get("MSD_PROSTATE_OUT", "experiments/msd_prostate_results"))
SEED = 41
EPOCHS = int(os.environ.get("MSD_EPOCHS", "35"))
SIDE = 160
DEVICE = torch.device("cpu")


def read_nii_gz(path):
    with gzip.open(path, "rb") as f:
        header = f.read(352)
        dims = struct.unpack("<8h", header[40:56])
        datatype = struct.unpack("<h", header[70:72])[0]
        vox_offset = int(struct.unpack("<f", header[108:112])[0])
        slope = struct.unpack("<f", header[112:116])[0]
        intercept = struct.unpack("<f", header[116:120])[0]
        raw = f.read()
    dtype = {2: np.dtype("u1"), 4: np.dtype("<i2"), 16: np.dtype("<f4"), 512: np.dtype("<u2")}[datatype]
    shape = tuple(dims[1: dims[0] + 1])
    arr = np.frombuffer(raw[vox_offset - len(header):], dtype=dtype).copy()
    arr = arr.reshape(tuple(reversed(shape)))
    if slope not in (0, 1):
        arr = arr.astype(np.float32) * slope + intercept
    return arr


def load_case(case_id):
    name = f"prostate_{case_id:02d}.nii.gz"
    img = read_nii_gz(DATA / "imagesTr" / name).astype(np.float32)
    mask = read_nii_gz(DATA / "labelsTr" / name).astype(np.uint8)
    if img.ndim == 4 and img.shape[0] == 2:
        img = img.transpose(1, 2, 3, 0)
    if mask.ndim == 3 and mask.shape[0] != img.shape[0] and mask.shape[-1] == img.shape[0]:
        mask = mask.transpose(2, 0, 1)
    if img.ndim != 4 or img.shape[-1] != 2:
        raise ValueError(f"Expected (z,y,x,2) T2/ADC image, got {img.shape} for {name}")
    if mask.ndim == 4:
        mask = mask[..., 0]
    for c in range(2):
        channel = img[..., c]
        lo, hi = np.percentile(channel, [1, 99])
        channel = np.clip(channel, lo, hi)
        img[..., c] = (channel - channel.mean()) / (channel.std() + 1e-6)
    return img, mask


def block(cin, cout):
    return nn.Sequential(nn.Conv2d(cin, cout, 3, padding=1), nn.BatchNorm2d(cout), nn.ReLU(inplace=True),
                         nn.Conv2d(cout, cout, 3, padding=1), nn.BatchNorm2d(cout), nn.ReLU(inplace=True))


class UNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.e1, self.e2, self.e3 = block(2, 16), block(16, 32), block(32, 64)
        self.mid = block(64, 96)
        self.d3, self.d2, self.d1 = block(160, 64), block(96, 32), block(48, 16)
        self.out = nn.Conv2d(16, 3, 1)

    def forward(self, x):
        a = self.e1(x)
        b = self.e2(F.max_pool2d(a, 2))
        c = self.e3(F.max_pool2d(b, 2))
        m = self.mid(F.max_pool2d(c, 2))
        x = self.d3(torch.cat([F.interpolate(m, size=c.shape[-2:], mode="bilinear", align_corners=False), c], 1))
        x = self.d2(torch.cat([F.interpolate(x, size=b.shape[-2:], mode="bilinear", align_corners=False), b], 1))
        x = self.d1(torch.cat([F.interpolate(x, size=a.shape[-2:], mode="bilinear", align_corners=False), a], 1))
        return self.out(x)


def resize_x(x):
    return F.interpolate(x, size=(SIDE, SIDE), mode="bilinear", align_corners=False)


def resize_y(y):
    return F.interpolate(y[:, None].float(), size=(SIDE, SIDE), mode="nearest")[:, 0].long()


def load_group(ids):
    xs, ys, meta = [], [], []
    for case_id in ids:
        img, mask = load_case(case_id)
        for z in range(img.shape[0]):
            x = torch.from_numpy(img[z].transpose(2, 0, 1))[None]
            y = torch.from_numpy(mask[z].astype(np.int64))[None, None].float()
            xs.append(F.interpolate(x, size=(SIDE, SIDE), mode="bilinear", align_corners=False)[0])
            ys.append(F.interpolate(y, size=(SIDE, SIDE), mode="nearest")[0, 0].long())
            meta.append(case_id)
    return torch.stack(xs), torch.stack(ys), meta


@torch.no_grad()
def evaluate(model, x, y, meta):
    model.eval()
    pred = []
    for start in range(0, len(x), 4):
        pred.append(model(x[start:start + 4]).argmax(1))
    pred = torch.cat(pred)
    per_case = {}
    for cid in sorted(set(meta)):
        idx = torch.tensor([m == cid for m in meta])
        vals = []
        for cls in (1, 2):
            p, t = pred[idx] == cls, y[idx] == cls
            denom = p.sum().item() + t.sum().item()
            vals.append(2 * (p & t).sum().item() / denom if denom else float("nan"))
        per_case[cid] = vals
    means = [float(np.nanmean([v[c] for v in per_case.values()])) for c in (0, 1)]
    return means, per_case


def main():
    random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
    torch.set_num_threads(max(1, min(6, os.cpu_count() or 1)))
    OUT.mkdir(parents=True, exist_ok=True)
    split = json.loads((DATA / "dataset.json").read_text())
    ids = sorted(int(Path(item["image"]).name.replace(".nii.gz", "").split("_")[1]) for item in split["training"])
    random.Random(SEED).shuffle(ids)
    val_ids, train_ids = sorted(ids[:6]), sorted(ids[6:])
    print(f"train patients={train_ids}; validation patients={val_ids}; epochs={EPOCHS}; device=CPU", flush=True)
    print("Loading labeled volumes...", flush=True)
    train_x, train_y, _ = load_group(train_ids)
    val_x, val_y, val_meta = load_group(val_ids)
    model = UNet().to(DEVICE)
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)
    best = -1
    rows = []
    start = time.time()
    for epoch in range(1, EPOCHS + 1):
        model.train()
        order = torch.randperm(len(train_x))
        losses = []
        for i in range(0, len(order), 8):
            ix = order[i:i + 8]
            xb, yb = train_x[ix], train_y[ix]
            optimizer.zero_grad(set_to_none=True)
            logits = model(xb)
            ce = F.cross_entropy(logits, yb, weight=torch.tensor([0.15, 1., 1.], dtype=torch.float32))
            probs = logits.softmax(1)
            target = F.one_hot(yb, 3).permute(0, 3, 1, 2).float()
            dice = 0
            for cls in (1, 2):
                inter = (probs[:, cls] * target[:, cls]).sum((1, 2))
                denom = probs[:, cls].sum((1, 2)) + target[:, cls].sum((1, 2))
                dice += (1 - (2 * inter + 1) / (denom + 1)).mean()
            loss = ce + dice
            loss.backward()
            optimizer.step()
            losses.append(loss.item())
        (dsc_pz, dsc_tz), _ = evaluate(model, val_x, val_y, val_meta)
        mean_dice = (dsc_pz + dsc_tz) / 2
        rows.append({"epoch": epoch, "train_loss": float(np.mean(losses)), "val_dice_pz": dsc_pz,
                     "val_dice_tz": dsc_tz, "val_mean_dice": mean_dice})
        if mean_dice > best:
            best = mean_dice
            torch.save({"state_dict": model.state_dict(), "seed": SEED, "train_ids": train_ids,
                        "validation_ids": val_ids, "side": SIDE}, OUT / "best_model.pt")
        if epoch == 1 or epoch % 5 == 0 or epoch == EPOCHS:
            print(f"epoch {epoch:02d}/{EPOCHS} loss={rows[-1]['train_loss']:.4f} val_PZ={dsc_pz:.3f} val_TZ={dsc_tz:.3f} mean={mean_dice:.3f} best={best:.3f}", flush=True)
    with (OUT / "training_history.csv").open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys()); writer.writeheader(); writer.writerows(rows)
    best_row = max(rows, key=lambda r: r["val_mean_dice"])
    summary = {"task": "MSD Task05 Prostate anatomical zone segmentation", "classes": {"1": "peripheral zone (PZ)", "2": "transition zone (TZ)"},
               "architecture": "2D U-Net, T2+ADC input, 160x160 slices", "seed": SEED, "epochs": EPOCHS,
               "train_patients": train_ids, "validation_patients": val_ids,
               "best_validation_epoch": best_row["epoch"], "validation_dice_pz": best_row["val_dice_pz"],
               "validation_dice_tz": best_row["val_dice_tz"], "validation_mean_dice": best_row["val_mean_dice"],
               "elapsed_seconds": round(time.time() - start, 1), "limitations": "Small internal patient-level split; no cancer lesion labels; not clinical validation."}
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
