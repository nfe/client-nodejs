/**
 * NFE.io SDK v3 - Polling Utility Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { poll, pollWithRetries, createPollingConfig } from '../../../../src/core/utils/polling.js';
import { TimeoutError } from '../../../../src/core/errors/index.js';

describe('Polling Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    // Clear all timers first to prevent them from firing
    vi.clearAllTimers();
    // Restore mocks
    vi.restoreAllMocks();
    // Use real timers again
    vi.useRealTimers();
  });

  describe('poll()', () => {
    it('should return immediately when isComplete returns true', async () => {
      const fn = vi.fn().mockResolvedValue({ status: 'complete' });
      const isComplete = vi.fn().mockReturnValue(true);

      const promise = poll({ fn, isComplete, initialDelay: 1000 });

      // No timers should be pending since it completes immediately
      await promise;

      expect(fn).toHaveBeenCalledTimes(1);
      expect(isComplete).toHaveBeenCalledTimes(1);
    });

    it('should poll multiple times until complete', async () => {
      const results = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'complete' },
      ];
      let callCount = 0;

      const fn = vi.fn().mockImplementation(() => {
        return Promise.resolve(results[callCount++]);
      });

      const isComplete = vi.fn().mockImplementation((result) => result.status === 'complete');

      const promise = poll({
        fn,
        isComplete,
        initialDelay: 1000,
        timeout: 10000,
      });

      // Advance through polling attempts
      await vi.advanceTimersByTimeAsync(1000); // First poll
      await vi.advanceTimersByTimeAsync(1500); // Second poll (1.5x backoff)

      const result = await promise;

      expect(result.status).toBe('complete');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should implement exponential backoff', async () => {
      const results = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'pending' },
        { status: 'complete' },
      ];
      let callCount = 0;

      const fn = vi.fn().mockImplementation(() => Promise.resolve(results[callCount++]));
      const isComplete = vi.fn().mockImplementation((r) => r.status === 'complete');
      const onPoll = vi.fn();

      const promise = poll({
        fn,
        isComplete,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2.0,
        onPoll,
        timeout: 60000,
      });

      // First attempt: immediate
      expect(fn).toHaveBeenCalledTimes(1);

      // Wait 1000ms (initial delay)
      await vi.advanceTimersByTimeAsync(1000);
      expect(fn).toHaveBeenCalledTimes(2);

      // Wait 2000ms (2.0x backoff)
      await vi.advanceTimersByTimeAsync(2000);
      expect(fn).toHaveBeenCalledTimes(3);

      // Wait 4000ms (2.0x backoff again)
      await vi.advanceTimersByTimeAsync(4000);
      expect(fn).toHaveBeenCalledTimes(4);

      await promise;
    });

    it('should respect maxDelay cap', async () => {
      const results = Array(10).fill({ status: 'pending' });
      results.push({ status: 'complete' });
      let callCount = 0;

      const fn = vi.fn().mockImplementation(() => Promise.resolve(results[callCount++]));
      const isComplete = vi.fn().mockImplementation((r) => r.status === 'complete');

      const promise = poll({
        fn,
        isComplete,
        initialDelay: 100,
        maxDelay: 500, // Cap at 500ms
        backoffFactor: 3.0, // Aggressive backoff
        timeout: 30000,
      });

      // Even with 3.0x backoff, delays should cap at 500ms
      // 100, 300, 500, 500, 500...

      await vi.advanceTimersByTimeAsync(100); // 2nd call
      await vi.advanceTimersByTimeAsync(300); // 3rd call
      await vi.advanceTimersByTimeAsync(500); // 4th call (capped)
      await vi.advanceTimersByTimeAsync(500); // 5th call (capped)
      await vi.advanceTimersByTimeAsync(500); // 6th call (capped)

      expect(fn).toHaveBeenCalledTimes(6);

      // Complete the polling
      await vi.runAllTimersAsync();
      await promise;
    });

    it('should throw TimeoutError when timeout exceeded', async () => {
      const fn = vi.fn().mockResolvedValue({ status: 'pending' });
      const isComplete = vi.fn().mockReturnValue(false);

      const promise = poll({
        fn,
        isComplete,
        timeout: 5000,
        initialDelay: 1000,
      }).catch(err => err); // Catch to prevent unhandled rejection

      // Advance time beyond timeout
      await vi.advanceTimersByTimeAsync(6000);

      // Wait for promise to settle
      const error = await promise;
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toMatch(/timeout exceeded/i);
    });

    it('should invoke onPoll callback on each attempt', async () => {
      const results = [
        { status: 'pending', attempt: 1 },
        { status: 'pending', attempt: 2 },
        { status: 'complete', attempt: 3 },
      ];
      let callCount = 0;

      const fn = vi.fn().mockImplementation(() => Promise.resolve(results[callCount++]));
      const isComplete = vi.fn().mockImplementation((r) => r.status === 'complete');
      const onPoll = vi.fn();

      const promise = poll({
        fn,
        isComplete,
        onPoll,
        initialDelay: 1000,
        timeout: 10000,
      });

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1500);

      await promise;

      expect(onPoll).toHaveBeenCalledTimes(3);
      expect(onPoll).toHaveBeenNthCalledWith(1, 1, results[0]);
      expect(onPoll).toHaveBeenNthCalledWith(2, 2, results[1]);
      expect(onPoll).toHaveBeenNthCalledWith(3, 3, results[2]);
    });

    it('should handle errors with onError callback', async () => {
      const error = new Error('Network error');
      let callCount = 0;

      const fn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(error);
        }
        return Promise.resolve({ status: 'complete' });
      });

      const isComplete = vi.fn().mockReturnValue(true);
      const onError = vi.fn().mockReturnValue(true); // Continue on error

      const promise = poll({
        fn,
        isComplete,
        onError,
        initialDelay: 1000,
        timeout: 10000,
      });

      // First attempt fails
      await vi.advanceTimersByTimeAsync(0);
      expect(onError).toHaveBeenCalledWith(error, 1);

      // Wait and retry
      await vi.advanceTimersByTimeAsync(1000);
      expect(onError).toHaveBeenCalledWith(error, 2);

      // Wait and succeed
      await vi.advanceTimersByTimeAsync(1500);

      const result = await promise;
      expect(result.status).toBe('complete');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should stop polling when onError returns false', async () => {
      const error = new Error('Fatal error');
      const fn = vi.fn().mockRejectedValue(error);
      const isComplete = vi.fn();
      const onError = vi.fn().mockReturnValue(false); // Stop on error

      const promise = poll({
        fn,
        isComplete,
        onError,
        initialDelay: 1000,
      });

      await expect(promise).rejects.toThrow('Fatal error');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('should re-throw errors when onError not provided', async () => {
      const error = new Error('API error');
      const fn = vi.fn().mockRejectedValue(error);
      const isComplete = vi.fn();

      const promise = poll({ fn, isComplete });

      await expect(promise).rejects.toThrow('API error');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('pollWithRetries()', () => {
    it('should poll with fixed delay and max attempts', async () => {
      const results = [
        { ready: false },
        { ready: false },
        { ready: true },
      ];
      let callCount = 0;

      const fn = vi.fn().mockImplementation(() => Promise.resolve(results[callCount++]));
      const isComplete = vi.fn().mockImplementation((r) => r.ready);

      const promise = pollWithRetries(fn, isComplete, 5, 1000);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;

      expect(result.ready).toBe(true);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = vi.fn().mockResolvedValue({ ready: false });
      const isComplete = vi.fn().mockReturnValue(false);

      const promise = pollWithRetries(fn, isComplete, 3, 1000).catch(err => err); // Catch to prevent unhandled rejection

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(0);

      // Wait for promise to settle
      const error = await promise;
      expect(error.message).toMatch(/failed after 3 attempts/i);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('createPollingConfig()', () => {
    it('should create config with sensible defaults', () => {
      const config = createPollingConfig(60000);

      expect(config).toEqual({
        timeout: 60000,
        initialDelay: 1000,
        maxDelay: 6000, // 10% of timeout
        backoffFactor: 1.5,
      });
    });

    it('should cap maxDelay at 10 seconds', () => {
      const config = createPollingConfig(300000); // 5 minutes

      expect(config.maxDelay).toBe(10000); // Capped at 10s, not 30s
    });
  });
});
