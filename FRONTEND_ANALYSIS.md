# MRI-RadAI analysis page

The analysis page is part of the root React 18 + Vite + TypeScript app. The landing page is unchanged.

## Run with sample responses

From the repository root, create `.env.local` with:

```env
VITE_USE_MOCKS=true
```

Then run `npm run dev`. The mock flow includes sample technical image-quality observations and a synthetic NIfTI mask clearly marked as mock output.

## Run with the backend

Set `VITE_USE_MOCKS=false` (or remove it) and run `npm run dev`. Vite proxies `/api` to `http://localhost:8000`. Start the FastAPI backend separately. The page expects:

- `POST /api/v1/zone-jobs` with multipart fields `t2` and `adc`.
- `GET /api/v1/zone-jobs/{id}` and `GET /api/v1/zone-jobs/{id}/mask`.
- `GET /api/v1/image-reviews/{id}`.

The image-quality section creates a review by uploading one or more PNG, JPEG, or DICOM sequence files to `POST /api/v1/uploads`, then starts `POST /api/v1/analyses` and polls `GET /api/v1/analyses/{id}` until it completes. It then loads observations from `GET /api/v1/image-reviews/{id}`. Existing reviews can also be opened by ID.

Reviewer feedback is stored in MongoDB through `POST` and reloaded through `GET /api/v1/image-reviews/{id}/feedback` or `/api/v1/zone-jobs/{id}/feedback`. The last zone-job ID is restored from browser local storage so its saved feedback remains accessible after a page reload. Mock mode stores feedback in browser local storage.

## Checks

Run `npm test` for NIfTI validation, polling stop conditions, and restricted-language filtering. Run `npm run build` for the TypeScript and Vite production build.
