# nnU-Net v2 prostate-zone segmentation

This experiment uses **nnU-Net v2, 3D full resolution** for anatomy segmentation on MSD Task05 Prostate. It predicts background (0), peripheral zone (PZ, 1), and transition zone (TZ, 2). It does **not** detect cancer or segment lesions: Task05 has zone masks, not cancer labels.

## Dataset and evaluation

- 32 labeled training cases, each with co-registered T2 and ADC channels.
- 16 challenge test cases have no publicly distributed reference masks in the downloaded MSD training package, so they are excluded from local scoring.
- Five-fold patient-level cross-validation uses nnU-Net's standard fixed splits. Report fold-level PZ and TZ Dice means and sample standard deviations, plus individual fold scores.
- nnU-Net automatically plans preprocessing, patch size, batch size, and the 3D full-resolution configuration from the dataset. Measure the first fold's wall-clock time on the target machine before estimating a complete run.

The original MSD NIfTI volumes already contain the modalities and labels, but nnU-Net v2 expects its own folder/channel naming convention. Its supported MSD converter separates the 4D T2/ADC image into channel files and carries over the training masks.

## Setup without Docker

Use Python 3.10 or newer. Install a PyTorch build matching the machine first, then install nnU-Net v2. For an NVIDIA GPU, install the matching CUDA-enabled PyTorch build. nnU-Net recommends a GPU with at least 10 GB VRAM for training; Apple's MPS does not currently support nnU-Net's 3D convolutions, so Apple Silicon may fall back to CPU.

Set paths to writable local folders. Keep the downloaded dataset and training outputs outside Git:

```bash
python3 -m venv .venv-nnunet
source .venv-nnunet/bin/activate
# Install PyTorch for your hardware first; see the official PyTorch selector.
pip install nnunetv2

export nnUNet_raw="$PWD/.nnunet/nnUNet_raw"
export nnUNet_preprocessed="$PWD/.nnunet/nnUNet_preprocessed"
export nnUNet_results="$PWD/.nnunet/nnUNet_results"
export nnUNet_n_proc_DA=4
mkdir -p "$nnUNet_raw" "$nnUNet_preprocessed" "$nnUNet_results"

nnUNetv2_convert_MSD_dataset -i /path/to/Task05_Prostate
nnUNetv2_plan_and_preprocess -d 5 --verify_dataset_integrity
```

To measure only fold 0 first, or run all folds after reviewing that timing, use the helper (from the repository root):

```bash
bash experiments/nnunet/train_cv.sh /path/to/Task05_Prostate fold0
bash experiments/nnunet/train_cv.sh /path/to/Task05_Prostate all
```

Confirm `Dataset005_Prostate/dataset.json` names channel 0 `T2`, channel 1 `ADC`, and labels 1 `PZ`, 2 `TZ` before training. The nnU-Net converter is the source of the dataset formatting; do not manually merge or reorder channels.

## Train and measure

Train one fold first and record its real runtime. On Linux with an NVIDIA GPU, for example:

```bash
CUDA_VISIBLE_DEVICES=0 /usr/bin/time -p nnUNetv2_train 5 3d_fullres 0 --npz
```

`--npz` retains validation probabilities. After checking the first fold's runtime, train folds 1–4 with the same command and corresponding fold number. Do not alter splits between folds. nnU-Net writes the checkpoints and validation predictions under `nnUNet_results`.

When all five folds finish, calculate the fold-level Dice summary:

```bash
python experiments/nnunet/evaluate_folds.py \
  --data /path/to/Task05_Prostate \
  --preprocessed "$nnUNet_preprocessed/Dataset005_Prostate" \
  --results "$nnUNet_results/Dataset005_Prostate/nnUNetTrainer__nnUNetPlans__3d_fullres"
```

The evaluator uses each fold's validation predictions and labels, computes a patient-level Dice for each zone, then reports the mean and sample standard deviation across patients within each fold and across the five fold means. It also writes per-fold and per-patient CSVs. It fails if any fold's validation predictions are missing; it never substitutes test-set results.

## Interpretation

Only report PZ and TZ anatomy segmentation metrics. Fold variation matters because there are only 32 labeled patients. ADC maps have coarser spatial resolution than T2, which can limit boundary precision. These outputs describe prostate zones; they say nothing about cancer, lesion presence, PI-RADS, or treatment. This is a research experiment, not a clinical model.
