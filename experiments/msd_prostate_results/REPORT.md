# MSD Task05 prostate zone segmentation: baseline run

## Outcome

An 8-epoch CPU baseline trained on T2 and ADC slices from 26 patients and evaluated on a held-out, patient-level split of 6 patients. The best checkpoint was epoch 8.

| Validation class | Dice score |
|---|---:|
| Peripheral zone (PZ) | 0.485 |
| Transition zone (TZ) | 0.714 |
| Mean of PZ and TZ | 0.599 |

Runtime was about 125 seconds on CPU. The model takes 160 × 160 axial slices and predicts background, PZ, and TZ. The best checkpoint, full epoch history, and JSON summary are in this folder.

## Interpretation and limits

This is a quick baseline, not a tuned or clinically validated model. The dataset has only 32 labeled patients; validation uses 6 of them. The remaining 16 challenge test scans were not used because their ground-truth masks are not included in the public training archive. The labels represent prostate anatomy (PZ/TZ), not cancer lesions. These scores therefore measure zone segmentation only and say nothing about cancer detection.

The baseline also resizes slices to 160 × 160, which loses spatial detail. A stronger next run should tune preprocessing and loss, train longer, repeat patient-level splits or cross-validation, and inspect overlays per case before considering any clinical use.

## Reproduce

The dataset was downloaded from the public MONAI S3 mirror and its MD5 matched the MONAI-published checksum `35138f08b1efaef89d7424d2bcc928db`. It was extracted outside the repository to `/private/tmp/msd_prostate/Task05_Prostate`.

```bash
MSD_EPOCHS=8 python3 experiments/msd_prostate_baseline.py
```

The run is deterministic at seed 41. Training and validation patient IDs are recorded in `summary.json`.
