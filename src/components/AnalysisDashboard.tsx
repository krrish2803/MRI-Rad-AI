import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Download, FileUp, HelpCircle, Loader2, RefreshCw, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { ApiError, createImageReview, createZoneJob, FeedbackResource, getAnalysisStatus, getImageReview, getSavedFeedback, getZoneJob, getZoneMask, ImageReviewResponse, saveFeedback, SavedFeedback, uploadReviewFile, USE_MOCKS, ZoneJobResponse } from '../api/client';
import { JobStatus, startJobPolling } from '../utils/polling';
import { compareNiftiPair, inspectNiftiFile } from '../utils/nifti';
import { filterApiObject, filterApiText } from '../utils/safeText';
import { MOCK_REVIEW_ID } from '../mocks/responses';

type ReviewObservation = { label: string; text: string };
type DisplayJob = ZoneJobResponse & { job_id: string; status: JobStatus };

function normalizeStatus(status: string): JobStatus {
  const value = status.toLowerCase();
  if (value === 'queued' || value === 'pending') return 'queued';
  if (value === 'running' || value === 'processing') return 'running';
  if (value === 'completed' || value === 'failed') return value;
  if (value === 'cancelled' || value === 'canceled') return 'cancelled';
  return 'running';
}

function extractJobId(payload: ZoneJobResponse): string {
  const data = payload as ZoneJobResponse & { id?: string; jobId?: string };
  return payload.job_id || data.id || data.jobId || '';
}

function extractWarnings(payload: Record<string, unknown>): { warnings: string[]; removed: boolean } {
  const candidate = payload.warnings ?? payload.warning_messages ?? payload.co_registration_warning ?? payload.warning;
  const values = Array.isArray(candidate) ? candidate : candidate == null ? [] : [candidate];
  let removed = false;
  const warnings = values.flatMap((item) => {
    const text = typeof item === 'string'
      ? item
      : item && typeof item === 'object' && 'message' in item
        ? String((item as { message: unknown }).message)
        : '';
    if (!text) return [];
    const safe = filterApiText(text);
    removed ||= safe.removed;
    return safe.text ? [safe.text] : [];
  });
  return { warnings, removed };
}

function imageReviewObservations(response: ImageReviewResponse): { items: ReviewObservation[]; removed: boolean } {
  const result = response.result ?? {};
  const raw = response.observations ?? response.image_observations ?? result.observations ?? result.image_observations;
  const list = Array.isArray(raw) ? raw : [];
  let removed = false;
  const items = list.flatMap((entry, index) => {
    const object = entry && typeof entry === 'object' ? entry as Record<string, unknown> : null;
    const text = typeof entry === 'string'
      ? entry
      : object && typeof object.technical_observation === 'string'
        ? object.technical_observation
        : object && typeof object.observation === 'string'
          ? object.observation
          : object && typeof object.text === 'string'
            ? object.text
            : '';
    const safe = filterApiText(text);
    removed ||= safe.removed;
    if (!safe.text) return [];
    const sequence = object?.sequence_type ?? object?.sequence;
    const safeLabel = typeof sequence === 'string' ? filterApiText(sequence) : null;
    removed ||= safeLabel?.removed ?? false;
    return [{ label: safeLabel?.text || `Observation ${index + 1}`, text: safe.text }];
  });
  return { items, removed };
}

function requestError(error: unknown, action: 'job' | 'review' | 'download'): { message: string; removed: boolean; fatal: boolean } {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status === 503) return { message: 'The service is not configured yet. Configure the backend, then retry.', removed: false, fatal: true };
  if (status === 404) return { message: action === 'job' ? 'This job was not found. Check the job ID or backend version, then run again.' : action === 'review' ? 'This image review was not found. Check the review ID and try again.' : 'The mask was not found. Check the job status and try again.', removed: false, fatal: true };
  const raw = error instanceof Error ? error.message : 'An unexpected request error occurred.';
  const safe = filterApiText(raw);
  if (!safe.text) return { message: 'Some API error text was hidden because it contained restricted clinical language.', removed: true, fatal: false };
  if (action === 'job' && /connection dropped/i.test(safe.text)) {
    return { message: 'Connection dropped. Job status will be checked again in 5 seconds; verify the backend is running.', removed: safe.removed, fatal: false };
  }
  if (error instanceof ApiError && error.status === undefined) {
    return { message: action === 'job' ? 'The API is unreachable. Start the backend or enable mock mode.' : action === 'review' ? 'The API is unreachable. Check the backend, then try again.' : 'The API is unreachable. Check the backend and retry the download.', removed: safe.removed, fatal: false };
  }
  return { message: safe.text, removed: safe.removed, fatal: false };
}

function CrossValidationValues({ modelInfo }: { modelInfo?: Record<string, unknown> }) {
  if (!modelInfo) return null;
  const nested = modelInfo.cross_validation && typeof modelInfo.cross_validation === 'object'
    ? modelInfo.cross_validation as Record<string, unknown>
    : undefined;
  const values = modelInfo.cross_validation_dice ?? modelInfo.cv_dice ?? nested?.dice;
  if (values == null) return null;
  const safe = filterApiObject(values);
  if (safe.value == null || safe.value === '') return null;
  return (
    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
      <p className="text-xs font-semibold text-slate-200">Cross-validation Dice — results on training data</p>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">{typeof safe.value === 'string' ? safe.value : JSON.stringify(safe.value, null, 2)}</pre>
      {safe.removed && <p className="mt-2 text-xs text-amber-300" role="status">Restricted text was removed from model information.</p>}
    </div>
  );
}

function ReviewerInput({ title, resource, resourceId }: { title: string; resource: FeedbackResource; resourceId: string }) {
  const [choice, setChoice] = useState('needs_review');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [removedText, setRemovedText] = useState(false);

  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    setSaved(false);
    void getSavedFeedback(resource, resourceId).then((existing) => {
      if (!active || !existing) return;
      const safeNote = filterApiText(existing.notes || '');
      setChoice(existing.feedback_type);
      setNote(safeNote.text);
      setRemovedText(safeNote.removed);
      setSaved(true);
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Saved reviewer input could not be loaded.');
    }).finally(() => {
      if (active) setBusy(false);
    });
    return () => { active = false; };
  }, [resource, resourceId]);

  const saveDraft = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await saveFeedback(resource, resourceId, { feedback_type: choice as SavedFeedback['feedback_type'], notes: note });
      setSaved(true);
    } catch (saveError) {
      const safeError = filterApiText(saveError instanceof Error ? saveError.message : 'Reviewer input could not be saved.');
      setError(safeError.text || 'Reviewer input could not be saved.');
      setRemovedText(safeError.removed);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={saveDraft} className="mt-5 rounded-xl border border-slate-700 bg-slate-950/60 p-4" aria-label={`${title} reviewer input`}>
      <div className="flex items-start gap-3">
        <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-200">Reviewer input</h3>
          <p className="mt-1 text-xs text-slate-400">Separate from model output. Saved reviewer input is linked to this result.</p>
          <fieldset className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <legend className="sr-only">Reviewer response</legend>
            {[
              ['agree', 'Agree'],
              ['disagree', 'Disagree'],
              ['needs_review', 'Needs review'],
            ].map(([value, label]) => (
              <label key={value} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                <input className="accent-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300" type="radio" name={`${title}-review-choice`} value={value} checked={choice === value} onChange={() => { setChoice(value); setSaved(false); }} />
                {label}
              </label>
            ))}
          </fieldset>
          <label className="mt-3 block text-xs font-medium text-slate-300" htmlFor={`${title}-review-note`}>Optional note</label>
          <textarea id={`${title}-review-note`} value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} rows={2} maxLength={1000} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30" placeholder="Add a research review note" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">{busy ? 'Saving…' : 'Save feedback'}</button>
            {saved && <span className="text-xs text-emerald-300" role="status">Feedback saved.</span>}
          </div>
          {error && <p className="mt-3 text-xs text-rose-200" role="alert">{error}</p>}
          {removedText && <p className="mt-2 text-xs text-amber-200" role="status">Restricted wording was removed from saved API text before display.</p>}
        </div>
      </div>
    </form>
  );
}

const statusClasses: Record<JobStatus, string> = {
  queued: 'border-amber-700 bg-amber-950/50 text-amber-200',
  running: 'border-sky-700 bg-sky-950/50 text-sky-200',
  completed: 'border-emerald-700 bg-emerald-950/50 text-emerald-200',
  failed: 'border-rose-700 bg-rose-950/50 text-rose-200',
  cancelled: 'border-slate-600 bg-slate-800 text-slate-200',
};

function initialZoneJob(): DisplayJob | null {
  try {
    const savedId = localStorage.getItem('mriradai:last-zone-job-id');
    return savedId ? { job_id: savedId, status: 'queued' } : null;
  } catch {
    return null;
  }
}

function initialReviewId(): string {
  try {
    return localStorage.getItem('mriradai:last-image-review-id') || (USE_MOCKS ? MOCK_REVIEW_ID : '');
  } catch {
    return USE_MOCKS ? MOCK_REVIEW_ID : '';
  }
}

export const AnalysisDashboard: React.FC = () => {
  const [t2File, setT2File] = useState<File | null>(null);
  const [adcFile, setAdcFile] = useState<File | null>(null);
  const [inputError, setInputError] = useState('');
  const [inputBusy, setInputBusy] = useState(false);
  const [job, setJob] = useState<DisplayJob | null>(initialZoneJob);
  const [jobError, setJobError] = useState('');
  const [connectionWarning, setConnectionWarning] = useState('');
  const [coRegistrationWarnings, setCoRegistrationWarnings] = useState<string[]>([]);
  const [apiTextRemoved, setApiTextRemoved] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [reviewId, setReviewId] = useState(initialReviewId);
  const [review, setReview] = useState<ImageReviewResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewTextRemoved, setReviewTextRemoved] = useState(false);
  const [reviewFiles, setReviewFiles] = useState<{ T2: File | null; DWI: File | null; ADC: File | null }>({ T2: null, DWI: null, ADC: null });
  const [reviewRunId, setReviewRunId] = useState(initialReviewId);
  const [reviewRunStatus, setReviewRunStatus] = useState<JobStatus | null>(() => initialReviewId() ? 'queued' : null);
  const [reviewRunError, setReviewRunError] = useState('');
  const [reviewCreateBusy, setReviewCreateBusy] = useState(false);

  const safeObservations = useMemo(() => review ? imageReviewObservations(review) : { items: [], removed: false }, [review]);

  useEffect(() => {
    if (!job?.job_id || ['completed', 'failed', 'cancelled'].includes(job.status)) return undefined;
    return startJobPolling(
      () => getZoneJob(job.job_id).then((response) => ({ ...response, status: normalizeStatus(response.status) })),
      (response) => {
        const status = normalizeStatus(response.status);
        const message = response.error_message ?? response.error ?? response.message;
        const safeMessage = typeof message === 'string' ? filterApiText(message) : null;
        if (safeMessage?.removed) setApiTextRemoved(true);
        setJobError(status === 'failed' && safeMessage?.text ? safeMessage.text : '');
        const warningResult = extractWarnings(response as unknown as Record<string, unknown>);
        if (warningResult.removed) setApiTextRemoved(true);
        setCoRegistrationWarnings((current) => warningResult.warnings.length ? warningResult.warnings : current);
        const filteredModelInfo = response.model_info ? filterApiObject(response.model_info) : null;
        if (filteredModelInfo?.removed) setApiTextRemoved(true);
        setJob({ ...response, job_id: extractJobId(response) || job.job_id, status, model_info: filteredModelInfo?.value as Record<string, unknown> | undefined });
        setConnectionWarning('');
      },
      (error) => {
        const info = requestError(error, 'job');
        setConnectionWarning(info.message);
        if (info.removed) setApiTextRemoved(true);
        if (info.fatal) {
          setJobError(info.message);
          setJob((current) => current ? { ...current, status: 'failed' } : current);
        }
      },
      5000,
    );
  }, [job?.job_id]);

  useEffect(() => {
    if (!job?.job_id) return;
    try { localStorage.setItem('mriradai:last-zone-job-id', job.job_id); } catch { /* storage may be disabled */ }
  }, [job?.job_id]);

  useEffect(() => {
    if (!reviewRunId || !reviewRunStatus || ['completed', 'failed', 'cancelled'].includes(reviewRunStatus)) return undefined;
    return startJobPolling(
      async () => {
        const response = await getAnalysisStatus(reviewRunId);
        return { ...response, status: normalizeStatus(response.status) };
      },
      (response) => {
        const status = normalizeStatus(response.status);
        setReviewRunStatus(status);
        if (status === 'failed') {
          const safe = filterApiText(response.error_message || 'The image-quality review failed. Try again when the service is ready.');
          setReviewRunError(safe.text || 'The image-quality review failed.');
          if (safe.removed) setReviewTextRemoved(true);
        }
      },
      (error) => {
        const info = requestError(error, 'review');
        setReviewRunError(info.message);
        if (info.fatal) setReviewRunStatus('failed');
      },
      5000,
    );
  }, [reviewRunId, reviewRunStatus]);

  useEffect(() => {
    if (!reviewRunId || reviewRunStatus !== 'completed') return;
    let active = true;
    setReviewLoading(true);
    setReviewRunError('');
    void getImageReview(reviewRunId).then((response) => {
      if (!active) return;
      const observations = imageReviewObservations(response);
      setReviewTextRemoved(observations.removed);
      setReview(response);
      setReviewId(reviewRunId);
    }).catch((error) => {
      if (!active) return;
      const info = requestError(error, 'review');
      setReviewRunError(filterApiText(info.message).text || 'The completed review could not be loaded.');
    }).finally(() => { if (active) setReviewLoading(false); });
    return () => { active = false; };
  }, [reviewRunId, reviewRunStatus]);

  const runSegmentation = async () => {
    setInputError('');
    setJobError('');
    setConnectionWarning('');
    setCoRegistrationWarnings([]);
    setDownloadError('');
    setApiTextRemoved(false);
    if (!t2File || !adcFile) {
      setInputError('Select both a T2 NIfTI file and an ADC NIfTI file.');
      return;
    }
    setInputBusy(true);
    try {
      const [t2Meta, adcMeta] = await Promise.all([inspectNiftiFile(t2File), inspectNiftiFile(adcFile)]);
      const mismatch = compareNiftiPair(t2Meta, adcMeta);
      if (mismatch.length) {
        setInputError(mismatch.join(' '));
        return;
      }
      const created = await createZoneJob(t2File, adcFile);
      const jobId = extractJobId(created);
      if (!jobId) throw new Error('The API response did not include a job ID. Check the backend contract.');
      const status = normalizeStatus(created.status || 'queued');
      const errorText = created.error_message ?? created.error ?? created.message;
      const safeError = typeof errorText === 'string' ? filterApiText(errorText) : null;
      if (safeError?.removed) setApiTextRemoved(true);
      const modelInfo = created.model_info ? filterApiObject(created.model_info) : null;
      if (modelInfo?.removed) setApiTextRemoved(true);
      const warningResult = extractWarnings(created as unknown as Record<string, unknown>);
      setCoRegistrationWarnings(warningResult.warnings);
      if (warningResult.removed) setApiTextRemoved(true);
      setJob({ ...created, job_id: jobId, status, model_info: modelInfo?.value as Record<string, unknown> | undefined });
      setJobError(status === 'failed' ? safeError?.text || 'The job failed. Review the message and run it again.' : '');
    } catch (error) {
      const info = requestError(error, 'job');
      const safe = filterApiText(info.message);
      setInputError(safe.text || 'The request could not be started.');
      if (info.removed || safe.removed) setApiTextRemoved(true);
    } finally {
      setInputBusy(false);
    }
  };

  const handleZoneSubmit = (event: FormEvent) => {
    event.preventDefault();
    void runSegmentation();
  };

  const runAgain = () => {
    setJob(null);
    setJobError('');
    setConnectionWarning('');
    void runSegmentation();
  };

  const createImageQualityReview = async (event: FormEvent) => {
    event.preventDefault();
    setReviewRunError('');
    setReviewError('');
    setReviewTextRemoved(false);
    setReview(null);
    const selected = (Object.entries(reviewFiles) as [keyof typeof reviewFiles, File | null][])
      .filter((entry): entry is [keyof typeof reviewFiles, File] => entry[1] !== null);
    if (!selected.length) {
      setReviewRunError('Choose at least one MRI image to start the technical quality review.');
      return;
    }
    setReviewCreateBusy(true);
    setReviewRunStatus(null);
    setReviewRunId('');
    try {
      const uploaded = await Promise.all(selected.map(([sequence, file]) => uploadReviewFile(file, sequence)));
      const created = await createImageReview(uploaded.map((item) => item.upload_id));
      setReviewRunId(created.analysis_id);
      setReviewId(created.analysis_id);
      try { localStorage.setItem('mriradai:last-image-review-id', created.analysis_id); } catch { /* storage may be disabled */ }
      setReviewRunStatus(normalizeStatus(created.status));
      if (normalizeStatus(created.status) === 'failed') {
        setReviewRunError('The image-quality review could not be started. Check the service and try again.');
      }
    } catch (error) {
      const info = requestError(error, 'review');
      const safe = filterApiText(info.message);
      setReviewRunError(safe.text || 'The image-quality review could not be started.');
      if (info.removed || safe.removed) setReviewTextRemoved(true);
    } finally {
      setReviewCreateBusy(false);
    }
  };

  const downloadMask = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (!job?.job_id) return;
    setDownloadBusy(true);
    setDownloadError('');
    try {
      const mask = await getZoneMask(job.job_id);
      const url = URL.createObjectURL(mask);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mri-radai-prostate-zone-mask.nii.gz';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const info = requestError(error, 'download');
      const safe = filterApiText(info.message);
      setDownloadError(safe.text || 'Mask download failed.');
      if (info.removed || safe.removed) setApiTextRemoved(true);
    } finally {
      setDownloadBusy(false);
    }
  };

  const loadImageReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!reviewId.trim()) {
      setReviewError('Enter an image review ID.');
      return;
    }
    setReviewLoading(true);
    setReviewError('');
    setReviewRunError('');
    setReviewRunId('');
    setReviewRunStatus(null);
    setReview(null);
    setReviewTextRemoved(false);
    try { localStorage.setItem('mriradai:last-image-review-id', reviewId.trim()); } catch { /* storage may be disabled */ }
    try {
      const response = await getImageReview(reviewId.trim());
      const observations = imageReviewObservations(response);
      setReviewTextRemoved(observations.removed);
      setReview(response);
      if (response.status && !['completed', 'complete'].includes(response.status.toLowerCase())) {
        setReviewError(response.status === 'failed' ? (response.error_message || 'This image review failed.') : `This image review is ${response.status}.`);
      }
    } catch (error) {
      const info = requestError(error, 'review');
      const safe = filterApiText(info.message);
      setReviewError(safe.text || 'The image review could not be loaded.');
      if (info.removed || safe.removed) setReviewTextRemoved(true);
    } finally {
      setReviewLoading(false);
    }
  };

  const visibleJobError = jobError || (job?.status === 'failed' ? 'The job failed. Run it again when ready.' : '');
  const modelInfo = job?.model_info;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-amber-700/60 bg-amber-950/40 px-4 py-4 sm:px-6" role="note">
          <p className="flex items-start gap-3 text-sm font-semibold leading-6 text-amber-100">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Research output. Not a clinical interpretation. Requires expert review.</span>
          </p>
          {USE_MOCKS && <p className="mt-2 pl-8 text-xs font-medium text-amber-200">Mock mode — sample responses and synthetic mask only.</p>}
        </header>

        <section aria-labelledby="zone-title" className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/20">
          <div className="border-b border-slate-700 bg-slate-900/80 px-4 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Section A · 3D anatomy</p>
            <h1 id="zone-title" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Prostate zone segmentation</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Provide matching 3D T2 and ADC NIfTI volumes. The model returns an anatomy mask for the peripheral and transition zones only.</p>
          </div>

          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.78fr)]">
            <div>
              <form id="zone-form" onSubmit={handleZoneSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label htmlFor="t2-nifti" className="block rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm font-medium text-slate-100">
                    <span className="flex items-center gap-2"><FileUp className="h-4 w-4 text-sky-300" aria-hidden="true" /> T2 volume <span className="text-rose-300" aria-hidden="true">*</span></span>
                    <span className="mt-2 block text-xs font-normal text-slate-400">NIfTI 3D · .nii or .nii.gz</span>
                    <input id="t2-nifti" type="file" required accept=".nii,.nii.gz,application/gzip,application/octet-stream" aria-describedby="t2-file-help" className="mt-3 block w-full cursor-pointer text-xs text-slate-300 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-sky-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300" onChange={(event) => { setT2File(event.target.files?.[0] ?? null); setInputError(''); setJob(null); }} />
                    <span id="t2-file-help" className="sr-only">Required T2 single-file 3D NIfTI volume</span>
                  </label>
                  <label htmlFor="adc-nifti" className="block rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm font-medium text-slate-100">
                    <span className="flex items-center gap-2"><FileUp className="h-4 w-4 text-sky-300" aria-hidden="true" /> ADC volume <span className="text-rose-300" aria-hidden="true">*</span></span>
                    <span className="mt-2 block text-xs font-normal text-slate-400">NIfTI 3D · .nii or .nii.gz</span>
                    <input id="adc-nifti" type="file" required accept=".nii,.nii.gz,application/gzip,application/octet-stream" aria-describedby="adc-file-help" className="mt-3 block w-full cursor-pointer text-xs text-slate-300 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-sky-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300" onChange={(event) => { setAdcFile(event.target.files?.[0] ?? null); setInputError(''); setJob(null); }} />
                    <span id="adc-file-help" className="sr-only">Required ADC single-file 3D NIfTI volume</span>
                  </label>
                </div>
                <p className="text-xs leading-5 text-slate-400">The browser checks NIfTI format, volume shape, and readable voxel spacing. The backend makes the final co-registration check.</p>
                {inputError && <p className="rounded-lg border border-rose-700 bg-rose-950/40 px-3 py-2 text-sm text-rose-100" role="alert">{inputError}</p>}
                {apiTextRemoved && <p className="rounded-lg border border-amber-700 bg-amber-950/50 px-3 py-2 text-xs text-amber-100" role="status">Some API text was removed because it contained restricted clinical wording.</p>}
                <button type="submit" disabled={inputBusy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-wait disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 sm:w-auto">
                  {inputBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
                  {inputBusy ? 'Checking volumes…' : 'Run zone segmentation'}
                </button>
              </form>

              {job && <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/70 p-4 sm:p-5" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">Job status</p>
                    <p className="mt-1 font-mono text-xs text-slate-300">{job.job_id}</p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${statusClasses[job.status]}`}>
                    {job.status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    {job.status}
                  </span>
                </div>
                {job.status === 'queued' && <p className="mt-3 text-sm text-slate-300">The job is queued and will be checked every 5 seconds.</p>}
                {job.status === 'running' && <p className="mt-3 text-sm text-slate-300">Segmentation is running. Status checks continue every 5 seconds.</p>}
                {connectionWarning && <p className="mt-3 rounded-lg border border-amber-700 bg-amber-950/40 px-3 py-2 text-sm text-amber-100" role="status">{connectionWarning}</p>}
                {coRegistrationWarnings.map((warning, index) => <p key={`${index}-${warning}`} className="mt-3 rounded-lg border border-amber-700 bg-amber-950/40 px-3 py-2 text-sm text-amber-100" role="status">Backend warning: {warning}</p>)}
                {job.status === 'failed' && <div className="mt-4 rounded-lg border border-rose-700 bg-rose-950/40 p-3" role="alert"><p className="text-sm text-rose-100">{visibleJobError}</p><button type="button" onClick={runAgain} disabled={inputBusy} className="mt-3 inline-flex items-center gap-2 rounded-md border border-rose-500/60 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Run again</button></div>}
                {job.status === 'cancelled' && <div className="mt-4 rounded-lg border border-slate-600 bg-slate-900 px-3 py-3 text-sm text-slate-200" role="status"><p>The job was cancelled. Check the input volumes, then try again.</p><button type="button" onClick={runAgain} className="mt-3 rounded-md border border-slate-500 px-3 py-2 text-xs font-semibold hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">Run again</button></div>}
                {job.status === 'completed' && <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
                  <div>
                    <a href={`/api/v1/zone-jobs/${encodeURIComponent(job.job_id)}/mask`} onClick={downloadMask} aria-label="Download NIfTI mask with background, peripheral zone, and transition zone labels" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">
                      {downloadBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                      {downloadBusy ? 'Preparing mask…' : 'Download mask'}
                    </a>
                    {downloadError && <p className="mt-2 max-w-xs text-xs text-rose-200" role="alert">{downloadError}</p>}
                  </div>
                  <ul aria-label="Segmentation mask label legend" className="space-y-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs leading-5 text-slate-200">
                    <li><span className="sr-only">Mask label legend: </span>0 = background</li>
                    <li>1 = peripheral zone (PZ)</li>
                    <li>2 = transition zone (TZ)</li>
                  </ul>
                </div>}
              </div>}
            </div>

            <aside className="self-start rounded-xl border border-slate-700 bg-slate-950/60 p-4 sm:p-5">
              <details>
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-200 marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300">
                  <span className="inline-flex items-center gap-2"><HelpCircle className="h-4 w-4 text-sky-300" aria-hidden="true" />Model information</span>
                </summary>
                <div className="mt-4 border-t border-slate-700 pt-4 text-xs leading-5 text-slate-300">
                  <p>5-fold nnU-Net v2, 3D full resolution, for anatomy segmentation.</p>
                  <p className="mt-2">Dataset: MSD Task05 Prostate · 32 labeled training cases.</p>
                  {modelInfo && <dl className="mt-3 space-y-1">
                    {typeof modelInfo.model === 'string' && <div><dt className="inline text-slate-400">Model: </dt><dd className="inline">{filterApiText(modelInfo.model).text}</dd></div>}
                    {typeof modelInfo.dataset === 'string' && <div><dt className="inline text-slate-400">Dataset: </dt><dd className="inline">{filterApiText(modelInfo.dataset).text}</dd></div>}
                    {typeof modelInfo.folds === 'number' && <div><dt className="inline text-slate-400">Folds: </dt><dd className="inline">{modelInfo.folds}</dd></div>}
                    {typeof modelInfo.training_cases === 'number' && <div><dt className="inline text-slate-400">Training cases: </dt><dd className="inline">{modelInfo.training_cases}</dd></div>}
                  </dl>}
                  <CrossValidationValues modelInfo={modelInfo} />
                </div>
              </details>
            </aside>
          </div>

          {job?.status === 'completed' && <div className="border-t border-slate-700 px-4 py-4 sm:px-6"><ReviewerInput title="zone" resource="zone-job" resourceId={job.job_id} /></div>}
        </section>

        <section aria-labelledby="quality-title" className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/20">
          <div className="border-b border-slate-700 bg-slate-900/80 px-4 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Section B · Image quality</p>
            <h2 id="quality-title" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Technical image quality review</h2>
            <p className="mt-2 rounded-lg border border-violet-700/70 bg-violet-950/30 px-3 py-2 text-sm font-medium text-violet-100">Technical image quality only. This does not detect cancer or lesions.</p>
          </div>
          <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
            <div>
              <form onSubmit={createImageQualityReview} className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Start a new review</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Upload one or more PNG, JPEG, or DICOM files. DICOM stacks can include multiple slices.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(['T2', 'DWI', 'ADC'] as const).map((sequence) => (
                    <label key={sequence} htmlFor={`review-${sequence.toLowerCase()}-file`} className="block rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs font-semibold text-slate-200">
                      {sequence} sequence <span className="font-normal text-slate-400">(optional)</span>
                      <input id={`review-${sequence.toLowerCase()}-file`} type="file" accept=".png,.jpg,.jpeg,.dcm,image/png,image/jpeg,application/dicom" onChange={(event) => setReviewFiles((current) => ({ ...current, [sequence]: event.target.files?.[0] ?? null }))} className="mt-2 block w-full cursor-pointer text-xs text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-violet-800 file:px-2 file:py-1.5 file:text-xs file:font-semibold file:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300" />
                    </label>
                  ))}
                </div>
                <button type="submit" disabled={reviewCreateBusy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 disabled:cursor-wait disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">
                  {reviewCreateBusy || reviewRunStatus === 'queued' || reviewRunStatus === 'running' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileUp className="h-4 w-4" aria-hidden="true" />}
                  {reviewCreateBusy ? 'Uploading…' : reviewRunStatus === 'queued' || reviewRunStatus === 'running' ? `Review ${reviewRunStatus}…` : 'Create image quality review'}
                </button>
                {reviewRunId && <p className="text-xs text-slate-400" aria-live="polite">Review ID: <span className="font-mono text-slate-200">{reviewRunId}</span> · Status: {reviewRunStatus}</p>}
                {reviewRunError && <p className="rounded-lg border border-rose-700 bg-rose-950/40 px-3 py-2 text-sm text-rose-100" role="alert">{reviewRunError}</p>}
              </form>

              <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500"><span className="h-px flex-1 bg-slate-700" />Or load an existing review<span className="h-px flex-1 bg-slate-700" /></div>
              <form onSubmit={loadImageReview} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label htmlFor="image-review-id" className="block text-xs font-semibold text-slate-300">Image review ID</label>
                  <input id="image-review-id" value={reviewId} onChange={(event) => setReviewId(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30" placeholder="Enter review ID" />
                </div>
                <button type="submit" disabled={reviewLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 disabled:cursor-wait disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300">
                  {reviewLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
                  {reviewLoading ? 'Loading…' : 'Load observations'}
                </button>
              </form>
              {reviewError && <p className="mt-4 rounded-lg border border-rose-700 bg-rose-950/40 px-3 py-2 text-sm text-rose-100" role="alert">{reviewError}</p>}
              {reviewTextRemoved && <p className="mt-4 rounded-lg border border-amber-700 bg-amber-950/50 px-3 py-2 text-xs text-amber-100" role="status">Some API text was removed because it contained restricted clinical wording.</p>}
              {review && <div className="mt-5" aria-live="polite">
                {safeObservations.items.length ? <ul className="space-y-3" aria-label="Technical image-quality observations only">
                  {safeObservations.items.map((item, index) => <li key={`${item.label}-${index}`} className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{item.text}</p>
                  </li>)}
                </ul> : <p className="rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm text-slate-300">No technical observations were returned.</p>}
              </div>}
            </div>
            <aside className="self-start rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-xs leading-5 text-slate-300">
              <h3 className="font-semibold text-slate-200">Review scope</h3>
              <ul className="mt-3 list-disc space-y-1 pl-4">
                <li>Motion and artifacts</li>
                <li>Image contrast</li>
                <li>Field of view</li>
                <li>Sequence coverage</li>
              </ul>
              <p className="mt-3 text-slate-400">Ratings and scores are not shown.</p>
            </aside>
          </div>
          {review && (!review.status || ['completed', 'complete'].includes(review.status.toLowerCase())) && (review.review_id || reviewId) && <div className="border-t border-slate-700 px-4 py-4 sm:px-6"><ReviewerInput title="image-quality" resource="image-review" resourceId={review.review_id || reviewId} /></div>}
        </section>

        {apiTextRemoved && <p className="sr-only" role="status">Restricted API wording was removed before display.</p>}
      </div>
    </div>
  );
};

export default AnalysisDashboard;
