import { createMockNiftiMask, mockImageReview, nextMockZoneJob, resetMockZoneJob, MOCK_REVIEW_ID } from '../mocks/responses';
import type { JobStatus } from '../utils/polling';

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export interface ZoneJobResponse {
  job_id: string;
  status: JobStatus | string;
  error_message?: string;
  error?: string;
  message?: string;
  warnings?: unknown;
  warning_messages?: unknown;
  warning?: unknown;
  co_registration_warning?: unknown;
  model_info?: Record<string, unknown>;
}

export interface ImageReviewResponse {
  review_id?: string;
  status?: string;
  error_message?: string | null;
  observations?: unknown;
  image_observations?: unknown;
  result?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ReviewAnalysisStatus {
  analysis_id: string;
  status: string;
  error_message?: string | null;
}

export interface SavedFeedback {
  feedback_id?: string;
  feedback_type: 'agree' | 'disagree' | 'needs_review';
  notes: string;
  updated_at?: string | null;
}

export type FeedbackResource = 'image-review' | 'zone-job';

export interface UploadedReviewFile {
  upload_id: string;
  sequence_type: string;
  slice_count: number;
}

export class ApiError extends Error {
  constructor(public status: number | undefined, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function decodeJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const error = payload.error as Record<string, unknown> | undefined;
    const message = typeof payload.detail === 'string'
      ? payload.detail
      : typeof error?.message === 'string'
        ? error.message
        : `Request failed with HTTP ${response.status}.`;
    throw new ApiError(response.status, message);
  }
  return payload as T;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(undefined, 'The API is unreachable. Start the backend or enable mock mode.');
  }
  return decodeJson<T>(response);
}

export async function uploadReviewFile(file: File, sequenceType: 'T2' | 'DWI' | 'ADC'): Promise<UploadedReviewFile> {
  if (USE_MOCKS) {
    return { upload_id: `mock-${sequenceType.toLowerCase()}-${Date.now()}`, sequence_type: sequenceType, slice_count: 1 };
  }
  const body = new FormData();
  body.append('file', file);
  body.append('sequence_type', sequenceType);
  return requestJson<UploadedReviewFile>('/api/v1/uploads', { method: 'POST', body });
}

export async function createImageReview(uploadIds: string[]): Promise<ReviewAnalysisStatus> {
  if (USE_MOCKS) {
    return { analysis_id: MOCK_REVIEW_ID, status: 'completed' };
  }
  return requestJson<ReviewAnalysisStatus>('/api/v1/analyses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload_ids: uploadIds }),
  });
}

export async function getAnalysisStatus(analysisId: string): Promise<ReviewAnalysisStatus> {
  if (USE_MOCKS) return { analysis_id: analysisId, status: 'completed' };
  return requestJson<ReviewAnalysisStatus>(`/api/v1/analyses/${encodeURIComponent(analysisId)}`);
}

export async function createZoneJob(t2: File, adc: File): Promise<ZoneJobResponse> {
  if (USE_MOCKS) {
    resetMockZoneJob();
    return { job_id: 'mock-zone-job-001', status: 'queued' };
  }
  const body = new FormData();
  body.append('t2', t2);
  body.append('adc', adc);
  let response: Response;
  try {
    response = await fetch('/api/v1/zone-jobs', { method: 'POST', body });
  } catch {
    throw new ApiError(undefined, 'The API is unreachable. Start the backend or enable mock mode.');
  }
  return decodeJson<ZoneJobResponse>(response);
}

export async function getZoneJob(jobId: string): Promise<ZoneJobResponse> {
  if (USE_MOCKS) return nextMockZoneJob();
  let response: Response;
  try {
    response = await fetch(`/api/v1/zone-jobs/${encodeURIComponent(jobId)}`);
  } catch {
    throw new ApiError(undefined, 'Connection dropped while checking the job. Retrying automatically.');
  }
  return decodeJson<ZoneJobResponse>(response);
}

export async function getZoneMask(jobId: string): Promise<Blob> {
  if (USE_MOCKS) return createMockNiftiMask();
  let response: Response;
  try {
    response = await fetch(`/api/v1/zone-jobs/${encodeURIComponent(jobId)}/mask`);
  } catch {
    throw new ApiError(undefined, 'The API is unreachable. Check the backend and try again.');
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    const message = typeof payload.detail === 'string' ? payload.detail : `Mask download failed with HTTP ${response.status}.`;
    throw new ApiError(response.status, message);
  }
  return response.blob();
}

export async function getImageReview(reviewId: string): Promise<ImageReviewResponse> {
  if (USE_MOCKS && (!reviewId || reviewId === MOCK_REVIEW_ID)) return mockImageReview;
  if (USE_MOCKS) throw new ApiError(404, 'No mock image review exists with that ID.');
  return requestJson<ImageReviewResponse>(`/api/v1/image-reviews/${encodeURIComponent(reviewId)}`);
}

function feedbackUrl(resource: FeedbackResource, id: string): string {
  const route = resource === 'zone-job' ? 'zone-jobs' : 'image-reviews';
  return `/api/v1/${route}/${encodeURIComponent(id)}/feedback`;
}

export async function getSavedFeedback(resource: FeedbackResource, id: string): Promise<SavedFeedback | null> {
  if (USE_MOCKS) {
    try {
      const value = localStorage.getItem(`mriradai-feedback:${resource}:${id}`);
      return value ? JSON.parse(value) as SavedFeedback : null;
    } catch {
      return null;
    }
  }
  const payload = await requestJson<{ feedback: SavedFeedback | null }>(feedbackUrl(resource, id));
  return payload.feedback;
}

export async function saveFeedback(resource: FeedbackResource, id: string, feedback: SavedFeedback): Promise<SavedFeedback> {
  if (USE_MOCKS) {
    const saved = { ...feedback, updated_at: new Date().toISOString() };
    localStorage.setItem(`mriradai-feedback:${resource}:${id}`, JSON.stringify(saved));
    return saved;
  }
  const payload = await requestJson<{ feedback: SavedFeedback }>(feedbackUrl(resource, id), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback_type: feedback.feedback_type, notes: feedback.notes }),
  });
  return payload.feedback;
}
