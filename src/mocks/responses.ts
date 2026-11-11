import type { ImageReviewResponse, ZoneJobResponse } from '../api/client';

export const MOCK_REVIEW_ID = 'mock-review-001';

export const mockImageReview: ImageReviewResponse = {
  review_id: MOCK_REVIEW_ID,
  observations: [
    { sequence: 'T2', observation: 'Motion is limited; gland margins remain readable in the supplied field of view.' },
    { sequence: 'ADC', observation: 'Signal contrast is visible. Peripheral coverage appears complete in this sample.' },
  ],
};

export const mockCompletedZoneJob: ZoneJobResponse = {
  job_id: 'mock-zone-job-001',
  status: 'completed',
  model_info: {
    model: 'nnU-Net v2 3d_fullres',
    folds: 5,
    dataset: 'MSD Task05 Prostate',
    training_cases: 32,
  },
};

let mockPollCount = 0;

export function resetMockZoneJob(): void {
  mockPollCount = 0;
}

export function nextMockZoneJob(): ZoneJobResponse {
  mockPollCount += 1;
  if (mockPollCount === 1) {
    return { job_id: mockCompletedZoneJob.job_id, status: 'running' };
  }
  return mockCompletedZoneJob;
}

export function createMockNiftiMask(): Promise<Blob> {
  const bytes = new Uint8Array(352 + (16 * 16 * 8));
  const view = new DataView(bytes.buffer);
  view.setInt32(0, 348, true);
  view.setInt16(40, 3, true);
  view.setInt16(42, 16, true);
  view.setInt16(44, 16, true);
  view.setInt16(46, 8, true);
  view.setInt16(70, 2, true);
  view.setInt16(72, 8, true);
  view.setFloat32(76, 1, true);
  view.setFloat32(80, 1, true);
  view.setFloat32(84, 1, true);
  view.setFloat32(88, 1, true);
  view.setFloat32(108, 352, true);
  bytes.set(new TextEncoder().encode('n+1\0'), 344);
  for (let i = 352; i < bytes.length; i += 1) bytes[i] = i % 3;
  return new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).blob();
}
