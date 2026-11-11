# MRI-RadAI

MRI-RadAI is a research prototype for reviewing prostate MRI image quality and segmenting prostate anatomy. It combines a static product landing page, a browser analysis workspace, a FastAPI service, MongoDB persistence, NVIDIA vision-language analysis, and an nnU-Net v2 training/inference workflow.

> **Research prototype only. Not for clinical use.** Image-quality observations are technical only; zone masks segment anatomy only. The project does not detect cancer or lesions, assign PI-RADS, or provide treatment advice. It has not been clinically validated. Use only synthetic or properly de-identified research data, and have qualified experts review all output.

## What is implemented

- **Landing page:** responsive, static HTML/CSS/JavaScript project overview and calls to action (`index.html`).
- **Analysis workspace:** React, TypeScript, Vite, and Tailwind interface (`app.html`) with two separate workflows:
  - **3D zone segmentation:** T2 and ADC NIfTI inputs, client-side format/shape/spacing checks, backend co-registration checks, job polling, and NIfTI mask download. Mask labels are 0 background, 1 peripheral zone (PZ), and 2 transition zone (TZ).
  - **Image-quality review:** upload PNG/JPEG/DICOM images for T2, DWI, or ADC; create and poll an analysis; display technical observations only.
- **NVIDIA integration:** OpenAI-compatible NVIDIA API request using the configured vision-language model (`nvidia/nemotron-3.5-super-vl-120b-a12b` by default). The service sends normalized PNG slices and validates structured technical observations.
- **MongoDB persistence:** upload metadata, analysis results, zone jobs, and reviewer feedback. Reviewer feedback can be reloaded after a page refresh; the browser remembers the most recent review and zone-job IDs.
- **Mock mode:** frontend sample image-review and zone-job responses; reviewer feedback is retained in browser local storage.
- **nnU-Net v2 experiment:** MSD Task05 conversion, preprocessing, five-fold 3D full-resolution training, and fold-level PZ/TZ Dice evaluation scripts.

## Stack and repository map

| Path | Purpose |
| --- | --- |
| `index.html`, `landing*.css`, `landing.js` | Static landing page |
| `app.html`, `src/` | React analysis workspace, API client, NIfTI checks, mocks, and text filtering |
| `backend/app/` | FastAPI routes, MongoDB access, image normalization, NVIDIA calls, and nnU-Net inference |
| `backend/tests/` | Backend API and service tests |
| `tests/` | Frontend utility tests for NIfTI checks, polling, and restricted-text filtering |
| `experiments/nnunet/` | MSD Task05 nnU-Net training and cross-validation evaluation |
| `MRI-RadAI_Build_Brief-2.pdf` | Supplied project brief |

## Requirements

- Node.js 18+ and npm
- Python 3.11+
- MongoDB Community locally or a MongoDB Atlas URI
- NVIDIA API key for live image-quality analysis
- For nnU-Net training: Linux with an NVIDIA CUDA GPU is recommended; 10 GB or more of GPU memory is a practical target. Training all folds is resource-intensive.

Docker is not used.

## Install and run

### 1. Install frontend dependencies

From the repository root:

```bash
npm ci
```

### 2. Install backend dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

On Windows PowerShell, activate with `.venv\Scripts\Activate.ps1`.

### 3. Configure the backend

While in `backend/`, create the ignored local environment file:

```bash
cp .env.example .env
```

Set `NVIDIA_API_KEY` and, if needed, `MONGODB_URI` in `backend/.env`. The default `NVIDIA_MODEL` is `nvidia/nemotron-3.5-super-vl-120b-a12b`. Never commit `.env` or put API keys in frontend variables. MongoDB must be reachable for uploads, jobs, and feedback persistence.

### 4. Start the API

From the `backend/` directory with the virtual environment active:

```bash
uvicorn app.main:app --reload --port 8000
```

The API health route is [http://localhost:8000/health](http://localhost:8000/health); interactive API docs are at [http://localhost:8000/docs](http://localhost:8000/docs).

### 5. Start the frontend

In a second terminal, from the repository root:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page and [http://localhost:3000/app.html](http://localhost:3000/app.html) for the analysis workspace. Vite proxies `/api` requests to `http://localhost:8000`.

## Use mock mode

The analysis workspace can be explored without the API. Create `.env.local` in the repository root:

```env
VITE_USE_MOCKS=true
```

Then run `npm run dev`. Mock mode uses sample technical observations and a synthetic NIfTI mask; it does not contact NVIDIA or MongoDB. Remove the setting or use `VITE_USE_MOCKS=false` for the real API. Restart Vite after changing environment variables.

## API workflows

### Image-quality review

1. `POST /api/v1/uploads` for each PNG, JPEG, or DICOM file, with a `sequence_type` of `T2`, `DWI`, or `ADC`.
2. `POST /api/v1/analyses` with the returned upload IDs.
3. Poll `GET /api/v1/analyses/{id}` until it completes, then read observations from `GET /api/v1/image-reviews/{id}`.
4. Read or save feedback at `GET` / `POST /api/v1/image-reviews/{id}/feedback`.

The page performs this sequence automatically and also supports opening a review by ID.

### Zone segmentation

1. `POST /api/v1/zone-jobs` with multipart fields `t2` and `adc`, both NIfTI.
2. Poll `GET /api/v1/zone-jobs/{id}` until completed or failed.
3. Download a completed mask from `GET /api/v1/zone-jobs/{id}/mask`.
4. Read or save reviewer feedback at `GET` / `POST /api/v1/zone-jobs/{id}/feedback`.

The segmentation endpoint returns 503 until the nnU-Net predictor and all five trained fold checkpoints are installed.

## Dataset: MSD Task05 Prostate

The model workflow uses **Medical Segmentation Decathlon Task05 Prostate**:

- **32 labeled training cases** and **16 challenge test cases**.
- Input modalities: **T2 and ADC** in the provided NIfTI volumes.
- Labels: prostate **peripheral zone** and **transition zone** masks, plus background. There are no cancer-lesion labels.
- The downloaded training package does not include reference masks for the challenge test cases. Report local results from five-fold cross-validation on the 32 labeled training cases; do not describe them as test-set results.

Dataset sources: [MSD on AWS Open Data](https://registry.opendata.aws/msd/) · [Task05_Prostate.tar](https://msd-for-monai.s3-us-west-2.amazonaws.com/Task05_Prostate.tar). The compressed archive is about 228 MB; extracted data and nnU-Net preprocessing require substantially more disk space. Check the dataset terms and citation requirements before redistribution.

Download and verify the archive (expected MD5: `35138f08b1efaef89d7424d2bcc928db`):

```bash
mkdir -p backend/.nnunet/data
curl -L \
  https://msd-for-monai.s3-us-west-2.amazonaws.com/Task05_Prostate.tar \
  -o backend/.nnunet/data/Task05_Prostate.tar

# Linux
echo "35138f08b1efaef89d7424d2bcc928db  backend/.nnunet/data/Task05_Prostate.tar" | md5sum -c -
# macOS alternative
md5 backend/.nnunet/data/Task05_Prostate.tar

tar -xf backend/.nnunet/data/Task05_Prostate.tar -C backend/.nnunet/data
```

## Train nnU-Net v2

Use a Linux CUDA machine for the five-fold run. Install a CUDA-compatible PyTorch build using the [official PyTorch installation selector](https://pytorch.org/get-started/locally/) before installing nnU-Net. Do not commit the dataset, checkpoints, or generated predictions; these are excluded by `.gitignore`.

From the repository root:

```bash
python3 -m venv .venv-nnunet
source .venv-nnunet/bin/activate

# Install the PyTorch command for your CUDA version from pytorch.org/get-started/locally first.
python -m pip install nnunetv2

export nnUNet_raw="$PWD/backend/.nnunet/nnUNet_raw"
export nnUNet_preprocessed="$PWD/backend/.nnunet/nnUNet_preprocessed"
export nnUNet_results="$PWD/backend/.nnunet/nnUNet_results"
export nnUNet_n_proc_DA=4

# First measure a single fold's runtime.
NNUNET_DEVICE=cuda bash experiments/nnunet/train_cv.sh \
  "$PWD/backend/.nnunet/data/Task05_Prostate" fold0

# After checking runtime and disk space, train folds 0–4 and calculate CV metrics.
NNUNET_DEVICE=cuda bash experiments/nnunet/train_cv.sh \
  "$PWD/backend/.nnunet/data/Task05_Prostate" all
```

The `all` mode converts the MSD data to nnU-Net format, verifies and preprocesses it, trains folds 0–4 with `3d_fullres`, then runs `experiments/nnunet/evaluate_folds.py`. It records per-fold and per-patient Dice results and summarizes variation across folds. Results are cross-validation metrics on training data, not held-out test scores. See [`experiments/nnunet/README.md`](experiments/nnunet/README.md) for training details.

After training, run the backend with the same `nnUNet_raw`, `nnUNet_preprocessed`, and `nnUNet_results` paths. Its nnU-Net predictor must be available in the Python environment used by FastAPI.

## Build and checks

Frontend production build:

```bash
npm run build
```

Frontend utility tests:

```bash
npm test
```

Backend tests and lint checks (from `backend/` with the backend environment active):

```bash
pip install -r requirements-dev.txt
pytest
ruff check app tests
black --check app tests
```

Backend tests mock external NVIDIA and nnU-Net calls. They do not validate clinical performance or train the model.

## Limitations and privacy

- NVIDIA observations are limited to technical image quality (motion, artifacts, contrast, field of view, and coverage). The service may still return incorrect or incomplete observations.
- nnU-Net predicts prostate zones only. It says nothing about cancer or lesions. With only 32 labeled patients, cross-validation results may vary substantially; ADC resolution can also limit boundary precision.
- API storage and review endpoints currently have no user authentication or per-user access control. Reviewer feedback is one saved entry per result, so a later save replaces the prior entry for that result.
- Upload data is stored locally and is not protected by production-grade encryption, access controls, or retention policy. Do not upload identifiable patient data.
- The landing-page anatomy artwork is illustrative, not a model prediction. No complete five-fold training metrics are bundled with this repository.
