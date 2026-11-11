#!/usr/bin/env bash
set -euo pipefail

dataset_dir="${1:-}"
mode="${2:-fold0}"
if [[ -z "$dataset_dir" || ! -d "$dataset_dir" ]]; then
  echo "Usage: $0 /path/to/Task05_Prostate [fold0|all]" >&2
  exit 2
fi
if [[ "$mode" != "fold0" && "$mode" != "all" ]]; then
  echo "Mode must be 'fold0' or 'all'." >&2
  exit 2
fi
if [[ -z "${nnUNet_raw:-}" || -z "${nnUNet_preprocessed:-}" || -z "${nnUNet_results:-}" ]]; then
  echo "Set nnUNet_raw, nnUNet_preprocessed, and nnUNet_results before running." >&2
  exit 2
fi

dataset="Dataset005_Prostate"
device="${NNUNET_DEVICE:-cuda}"
dataset_raw="$nnUNet_raw/$dataset"
mkdir -p "$nnUNet_raw" "$nnUNet_preprocessed" "$nnUNet_results" experiments/nnunet/logs

if [[ ! -d "$dataset_raw" ]]; then
  nnUNetv2_convert_MSD_dataset -i "$dataset_dir"
fi
nnUNetv2_plan_and_preprocess -d 5 --verify_dataset_integrity

run_fold() {
  local fold="$1"
  local stamp
  stamp="$(date +%Y%m%d-%H%M%S)"
  echo "Starting nnU-Net v2 3d_fullres fold $fold on $device at $(date -Iseconds)"
  /usr/bin/time -p nnUNetv2_train 5 3d_fullres "$fold" -device "$device" --npz 2>&1 | tee "experiments/nnunet/logs/fold-${fold}-${stamp}.log"
  echo "Finished fold $fold at $(date -Iseconds)"
}

run_fold 0
if [[ "$mode" == "all" ]]; then
  for fold in 1 2 3 4; do
    run_fold "$fold"
  done
  python experiments/nnunet/evaluate_folds.py \
    --data "$dataset_dir" \
    --preprocessed "$nnUNet_preprocessed/$dataset" \
    --results "$nnUNet_results/$dataset/nnUNetTrainer__nnUNetPlans__3d_fullres"
else
  echo "Fold 0 timing recorded. Review hardware/runtime before choosing mode 'all'."
fi
