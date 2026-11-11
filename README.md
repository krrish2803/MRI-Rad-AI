# MRI-RadAI

MRI-RadAI is a local research prototype for prostate MRI image quality review and prostate-zone segmentation. Its public landing page and workspace use plain HTML, CSS, and JavaScript. The API uses FastAPI, MongoDB, local image storage, NVIDIA NIM for technical image-quality observations, and an optional nnU-Net v2 inference runner for zone masks.

**This is not a diagnostic system.** The NVIDIA API is explicitly restricted to technical image quality and does not return lesion or cancer findings. The nnU-Net model segments peripheral zone (PZ) and transition zone (TZ) anatomy only. Task05 has no cancer lesion labels. Do not use this system for patient care or upload identifiable patient information.

## Backend features

- `POST /api/v1/uploads`: magic-byte validation for DICOM, PNG, and JPEG; per-file size limit; DICOM rescale/windowing; grayscale PNG slices; server-generated storage paths; duplicate detection by SHA-256 and sequence.
- `GET /api/v1/uploads/{id}` and `GET /api/v1/uploads/{id}/slices/{index}`: upload metadata and PNG slice previews.
- `POST /api/v1/analyses`: choose one to three distinct sequences and selected/default slices, create a background job, and return its ID.
- `GET /api/v1/analyses/{id}` and `GET /api/v1/analyses`: polling and recent history.
- NVIDIA NIM vision call: technical image-quality summary only, structured JSON validation, one repair attempt, retry handling, usage and optional cost accounting.
- `POST /api/v1/analyses/{id}/feedback`: save research feedback (`agree`, `disagree`, `needs_review`, or a PZ/TZ boundary issue).
- `POST /api/v1/zone-segmentations`: accept co-registered T2 and ADC 3D NIfTI volumes, invoke nnU-Net v2 using all five folds, and save a PZ/TZ mask. This requires the trained model and nnU-Net predictor to be installed locally.
- `GET /api/v1/zone-segmentations/{id}` and `/mask`: poll and download the resulting NIfTI anatomy mask.
- MongoDB collections: `uploads`, `analyses`, `feedback`, and `zone_segmentations`. Normalized slices and NIfTI inputs/outputs are stored under `STORAGE_DIR`; MongoDB holds metadata and job results.
- OpenAPI/Swagger: `http://localhost:8000/docs`; health: `http://localhost:8000/health`.

## Run locally (no Docker)

Requirements: Python 3.11 or newer, Node.js/npm, MongoDB Community running locally or MongoDB Atlas, and an NVIDIA API key. The API uses `MONGODB_URI` to connect to MongoDB.

1. Create the Python environment and install dependencies:

   ```bash
   python3.12 -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

2. Copy local settings and set your NVIDIA key:

   ```bash
   cp backend/.env.example .env
   ```

   Set `NVIDIA_API_KEY` in `.env`; leave pricing unset unless you have confirmed current per-token rates. The default model is configurable with `NVIDIA_MODEL`. Do not commit `.env`.

3. Start the local MongoDB service using your operating system's service manager. On macOS with the MongoDB Community formula installed, use `brew services start mongodb-community`. For MongoDB Atlas, put its URI in `MONGODB_URI` instead.

4. Start the API:

   ```bash
   uvicorn app.main:app --app-dir backend --reload --port 8000
   ```

5. In another terminal, start the static frontend:

   ```bash
   npm install
   npm run dev
   ```

   Open the Vite URL shown in the terminal (normally `http://localhost:3000`). Vite proxies `/api` to the local API.

## Train nnU-Net v2 on MSD Task05

The separate reproducible training instructions are in [`experiments/nnunet/README.md`](experiments/nnunet/README.md). They convert MSD Task05 to nnU-Net v2 format, plan/preprocess, train `3d_fullres` folds 0–4, and calculate per-zone fold means and standard deviations. The model predicts background, PZ, and TZ only.

When running the backend zone-mask endpoint, activate the nnU-Net environment or set `NNUNET_PREDICT_COMMAND` to its `nnUNetv2_predict` executable. Set the same `nnUNet_raw`, `nnUNet_preprocessed`, and `nnUNet_results` paths used for training. The inference route runs only after predictor installation and trained fold checkpoints are available.

## Test the backend

Install dev/test requirements and run the offline suite:

```bash
pip install -r backend/requirements-dev.txt
pytest --cov=app.services --cov-report=term-missing --cov-fail-under=70
ruff check backend/app backend/tests
black --check backend/app backend/tests
```

Tests use mocked NVIDIA and nnU-Net calls. They do not contact either external model service.

## Current boundaries

- The hosted NVIDIA VLM returns technical image-quality observations only. It does not identify, locate, score, or characterize suspected cancer.
- nnU-Net uses the MSD Task05 T2 and ADC channels and PZ/TZ masks. It does not output lesions or cancer predictions.
- PNG/JPEG files are single-image inputs. DICOM multi-frame files become stacks; one-slice DICOM is one slice. Patient identifiers from DICOM headers are not stored. Original DICOM files are discarded unless `KEEP_ORIGINAL_DICOM=true`.
- The nnU-Net endpoint requires a co-registered T2/ADC NIfTI pair. It is independent of the image-quality analysis route.
- Upload storage is local and unauthenticated. This prototype has no production encryption, access controls, retention policy, or clinical validation. It is not HIPAA-compliant.
- This machine currently has no local Task05 dataset and no NVIDIA CUDA GPU, and `NVIDIA_API_KEY` is not configured. Thus no nnU-Net fold metrics or live NVIDIA analysis results have been produced here.
- The landing-page anatomy preview remains illustrative. It is not a prediction from the trained model.

## Repository map

- `index.html`, `landing*.css`, `landing.js`: static landing page.
- `app.html`, `workspace*.css`, `workspace.js`: upload, analysis status, review, feedback, and zone-mask UI.
- `backend/app/`: FastAPI API, MongoDB, DICOM/image pipeline, NVIDIA client, NIfTI validation, nnU-Net runner.
- `backend/tests/`: mocked API and service tests.
- `experiments/nnunet/`: nnU-Net v2 training and CV evaluation workflow.
- `experiments/msd_prostate_baseline.py`: earlier small 2D baseline, retained for comparison only.
- `MRI-RadAI_Build_Brief-2.pdf`: supplied project brief.
