export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface PollableJob {
  status: JobStatus;
}

export const isTerminalJobStatus = (status: JobStatus): boolean =>
  status === 'completed' || status === 'failed' || status === 'cancelled';

export function startJobPolling<T extends PollableJob>(
  getJob: () => Promise<T>,
  onJob: (job: T) => void,
  onError: (error: unknown) => void,
  intervalMs = 5000,
): () => void {
  let stopped = false;
  let inFlight = false;
  let timer: ReturnType<typeof setInterval>;
  const stop = () => {
    stopped = true;
    clearInterval(timer);
  };
  const poll = async () => {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      const job = await getJob();
      if (stopped) return;
      onJob(job);
      if (isTerminalJobStatus(job.status)) stop();
    } catch (error) {
      if (!stopped) onError(error);
      const status = (error as { status?: number })?.status;
      if (status === 404 || status === 503) stop();
    } finally {
      inFlight = false;
    }
  };
  timer = setInterval(() => void poll(), intervalMs);
  void poll();
  return stop;
}
