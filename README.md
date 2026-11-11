# MRI-RadAI

MRI-RadAI is a college research prototype for exploring a prostate MRI review workflow. The public landing page and upload screen use plain HTML, CSS, and JavaScript. A small FastAPI service stores uploaded image files and analysis/feedback records in MongoDB and can send image prompts to NVIDIA's hosted vision API.

**This is not a diagnostic system.** The NVIDIA response is an experimental visual description of a few image files, not an interpretation of a complete MRI study. Do not use it for patient care or upload identifiable patient information. A qualified radiologist must review original DICOM images and clinical context.

## Implemented

- Premium static landing page describing the problem, product concept, workflow, audience, FAQs, and limitations.
- Local upload and status screen for 1–3 PNG/JPEG images (50 MB maximum each).
- MongoDB persistence: image bytes in GridFS, analysis state and research feedback in collections.
- Background analysis call using NVIDIA's OpenAI-compatible chat completions endpoint and a vision-capable model.
- Feedback actions: agree, disagree, or needs review.
- Existing Task05 prostate zone-segmentation baseline and experiment report under `experiments/`.
- Reproducible nnU-Net v2 3D full-resolution conversion, five-fold training, and fold-level Dice evaluation instructions under `experiments/nnunet/`.

The Task05 experiment labels prostate peripheral and transition zones; it does not provide cancer lesion labels. Its model should not be presented as cancer detection. The nnU-Net workflow is prepared, but five-fold training has not been run in this environment because the dataset is not present locally and this Mac has no NVIDIA CUDA GPU. The current upload API does not call the nnU-Net model.

## Run locally

Requirements: Node.js/npm, Python 3.11+, a local MongoDB service or MongoDB Atlas URI, and an NVIDIA API key from the NVIDIA API catalog.

1. Install front-end dependencies:

   ```bash
   npm install
   ```

2. Create and activate a Python virtual environment, then install the API dependencies:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   ```

3. Configure the backend environment:

   ```bash
   cp backend/.env.example .env
   ```

   Set `NVIDIA_API_KEY` in `.env`; update `MONGODB_URI` if you use MongoDB Atlas. The default model is `moonshotai/kimi-k2.5`; set `NVIDIA_MODEL` if availability differs for your account. Do not commit `.env`.

4. Start MongoDB using your operating system's MongoDB service manager, or use a MongoDB Atlas connection URI in `MONGODB_URI`.

5. Start the API in the activated virtual environment:

   ```bash
   uvicorn app.main:app --app-dir backend --reload --port 8000
   ```

6. In another terminal, start the vanilla front end:

   ```bash
   npm run dev
   ```

   Open the Vite URL (usually `http://localhost:3000`). The UI proxies `/api` requests to `http://localhost:8000`. API docs are at `http://localhost:8000/docs`; health check is `/api/health`.

MongoDB must be running and accessible at `MONGODB_URI` before creating an analysis.

## NVIDIA integration

The service calls `POST https://integrate.api.nvidia.com/v1/chat/completions`. The endpoint is OpenAI-compatible; the NVIDIA vision model accepts image content in chat messages. NVIDIA's current API model documentation and image format are subject to change, so configure `NVIDIA_MODEL` for a vision model enabled for your account. See [NVIDIA LLM API reference](https://docs.api.nvidia.com/nim/reference/llm-apis) and [Kimi K2.5 image input format](https://docs.api.nvidia.com/nim/reference/moonshotai-kimi-k2-5-infer).

## Current boundaries

- Upload accepts PNG/JPEG only. DICOM, NIfTI, multi-slice series, preprocessing, PACS, authentication, and clinical deployment are not implemented.
- The model is asked not to diagnose, assign PI-RADS, or recommend treatment, but generated text can still be wrong.
- Uploads are stored in local MongoDB GridFS without production encryption, access controls, retention policies, or de-identification. Use synthetic or properly de-identified research images only.
- The landing page's anatomy and case preview are illustrative. The Task05 baseline model is a separate zone-segmentation experiment and is not connected to the upload analysis API.
- The legacy React/Three.js prototype remains in `src/`; the landing and upload flows are vanilla HTML/CSS/JS as requested.

## Repository contents

- `index.html`, `landing.css`, `landing-more.css`, `landing.js`: static landing page.
- `app.html`, `workspace.css`, `workspace.js`: image upload/research review flow.
- `backend/app/main.py`: FastAPI, MongoDB, GridFS, NVIDIA API, and feedback endpoints.
- `experiments/`: Task05 baseline code and outputs.
- `MRI-RadAI_Build_Brief-2.pdf`: supplied project build brief.
