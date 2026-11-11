import { afterEach, describe, expect, it, vi } from 'vitest';
import { startJobPolling } from '../src/utils/polling';

describe('zone job polling', () => {
  afterEach(() => vi.useRealTimers());

  it.each(['completed', 'failed', 'cancelled'] as const)('stops polling when status is %s', async (status) => {
    vi.useFakeTimers();
    const getJob = vi.fn().mockResolvedValue({ status });
    const onJob = vi.fn();
    const onError = vi.fn();
    startJobPolling(getJob, onJob, onError, 5000);

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(15000);

    expect(getJob).toHaveBeenCalledTimes(1);
    expect(onJob).toHaveBeenCalledWith({ status });
    expect(onError).not.toHaveBeenCalled();
  });

  it('continues through running and stops after a terminal response', async () => {
    vi.useFakeTimers();
    const getJob = vi.fn()
      .mockResolvedValueOnce({ status: 'running' })
      .mockResolvedValueOnce({ status: 'completed' });
    startJobPolling(getJob, vi.fn(), vi.fn(), 5000);

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(15000);

    expect(getJob).toHaveBeenCalledTimes(2);
  });
});
