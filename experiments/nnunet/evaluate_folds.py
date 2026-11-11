#!/usr/bin/env python3
"""Score nnU-Net v2 Task05 OOF predictions, excluding unlabeled test cases."""
import argparse
import csv
import json
import statistics
from pathlib import Path

import nibabel as nib
import numpy as np


CLASSES = {1: "PZ", 2: "TZ"}


def dice(pred: np.ndarray, target: np.ndarray, class_id: int) -> float:
    p = pred == class_id
    t = target == class_id
    denom = int(p.sum()) + int(t.sum())
    return 1.0 if denom == 0 else 2.0 * float(np.logical_and(p, t).sum()) / denom


def read_label(path: Path) -> np.ndarray:
    arr = np.asanyarray(nib.load(str(path)).dataobj)
    if arr.ndim == 4 and arr.shape[-1] == 1:
        arr = arr[..., 0]
    if arr.ndim != 3:
        raise ValueError(f"Expected a 3D segmentation at {path}, got shape {arr.shape}")
    return arr.astype(np.uint8, copy=False)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True, help="Original Task05_Prostate folder")
    parser.add_argument("--preprocessed", type=Path, required=True, help="nnUNet_preprocessed/Dataset005_Prostate")
    parser.add_argument("--results", type=Path, required=True, help="3d_fullres trainer results folder")
    parser.add_argument("--output", type=Path, default=Path("experiments/nnunet/results"))
    args = parser.parse_args()

    split_path = args.preprocessed / "splits_final.json"
    if not split_path.exists():
        raise SystemExit(f"Missing nnU-Net cross-validation splits: {split_path}")
    splits = json.loads(split_path.read_text())
    if len(splits) != 5:
        raise SystemExit(f"Expected 5 nnU-Net folds, found {len(splits)}")

    records = []
    fold_rows = []
    for fold_index, fold in enumerate(splits):
        val_cases = fold["val"]
        pred_dir = args.results / f"fold_{fold_index}" / "validation"
        missing = [case for case in val_cases if not (pred_dir / f"{case}.nii.gz").is_file()]
        if missing:
            raise SystemExit(f"Fold {fold_index} missing {len(missing)} validation predictions in {pred_dir}; e.g. {missing[:3]}")
        by_class = {class_id: [] for class_id in CLASSES}
        for case in val_cases:
            prediction = read_label(pred_dir / f"{case}.nii.gz")
            truth = read_label(args.data / "labelsTr" / f"{case}.nii.gz")
            if prediction.shape != truth.shape:
                raise SystemExit(f"Shape mismatch for {case}: prediction {prediction.shape}, label {truth.shape}")
            row = {"fold": fold_index, "case": case}
            for class_id, class_name in CLASSES.items():
                score = dice(prediction, truth, class_id)
                by_class[class_id].append(score)
                row[f"dice_{class_name.lower()}"] = score
            records.append(row)
        summary = {"fold": fold_index, "n_patients": len(val_cases)}
        for class_id, class_name in CLASSES.items():
            summary[f"dice_{class_name.lower()}_mean"] = statistics.mean(by_class[class_id])
        summary["dice_mean_zones"] = statistics.mean(
            [summary["dice_pz_mean"], summary["dice_tz_mean"]]
        )
        fold_rows.append(summary)

    args.output.mkdir(parents=True, exist_ok=True)
    with (args.output / "patient_dice.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=["fold", "case", "dice_pz", "dice_tz"])
        writer.writeheader()
        writer.writerows(records)
    with (args.output / "fold_dice.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fold_rows[0].keys())
        writer.writeheader()
        writer.writerows(fold_rows)

    report = {"task": "MSD Task05 Prostate anatomical zone segmentation",
              "architecture": "nnU-Net v2 3d_fullres", "evaluation": "5-fold out-of-fold on 32 labeled training cases",
              "classes": {"1": "peripheral zone (PZ)", "2": "transition zone (TZ)"},
              "test_cases_scored": 0, "folds": fold_rows, "summary_across_fold_means": {}}
    for metric in ("dice_pz_mean", "dice_tz_mean", "dice_mean_zones"):
        values = [row[metric] for row in fold_rows]
        report["summary_across_fold_means"][metric] = {
            "mean": statistics.mean(values),
            "std_sample": statistics.stdev(values),
        }
    report["limitations"] = [
        "Only prostate anatomy zones are labeled; this model does not predict cancer or lesions.",
        "Fold-to-fold variation is material with 32 labeled patients.",
        "The 16 unlabeled challenge test cases were not scored.",
    ]
    (args.output / "summary.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
