/**
 * NFE.io SDK v3 - Polling Utility
 *
 * Generic polling utility for handling asynchronous operations
 * with exponential backoff, timeout enforcement, and progress tracking.
 */

import { TimeoutError } from '../errors/index.js';

// ============================================================================
// Types
// ============================================================================

export interface PollingOptions<T> {
  /**
   * Function to execute on each poll attempt
   */
  fn: () => Promise<T>;

  /**
   * Function to determine if polling should stop
   * Returns true when the desired state is reached
   */
  isComplete: (result: T) => boolean;

  /**
   * Total timeout in milliseconds
   * @default 120000 (2 minutes)
   */
  timeout?: number;

  /**
   * Initial delay before first poll in milliseconds
   * @default 1000 (1 second)
   */
  initialDelay?: number;

  /**
   * Maximum delay between polls in milliseconds
   * @default 10000 (10 seconds)
   */
  maxDelay?: number;

  /**
   * Backoff multiplier for exponential backoff
   * @default 1.5
   */
  backoffFactor?: number;

  /**
   * Callback invoked after each poll attempt
   * Useful for progress tracking and logging
   */
  onPoll?: (attempt: number, result: T) => void;

  /**
   * Optional error handler for non-fatal errors
   * Return true to continue polling, false to abort
   */
  onError?: (error: Error, attempt: number) => boolean;
}

// ============================================================================
// Polling Utility
// ============================================================================

/**
 * Generic polling utility with exponential backoff
 *
 * @template T - Type of the result being polled
 * @param options - Polling configuration options
 * @returns Promise that resolves with the final result
 * @throws {TimeoutError} If polling exceeds timeout
 * @throws {Error} If fn() throws and onError doesn't handle it
 *
 * @example
 * ```typescript
 * const invoice = await poll({
 *   fn: () => nfe.serviceInvoices.retrieve('company-id', 'invoice-id'),
 *   isComplete: (inv) => ['Issued', 'IssueFailed'].includes(inv.flowStatus),
 *   timeout: 120000,
 *   onPoll: (attempt, inv) => console.log(`Attempt ${attempt}: ${inv.flowStatus}`)
 * });
 * ```
 */
export async function poll<T>(options: PollingOptions<T>): Promise<T> {
  const {
    fn,
    isComplete,
    timeout = 120000, // 2 minutes default
    initialDelay = 1000, // 1 second default
    maxDelay = 10000, // 10 seconds default
    backoffFactor = 1.5,
    onPoll,
    onError,
  } = options;

  const startTime = Date.now();
  let delay = initialDelay;
  let attempt = 0;

  while (true) {
    attempt++;

    try {
      // Execute polling function
      const result = await fn();

      // Invoke progress callback if provided
      if (onPoll) {
        onPoll(attempt, result);
      }

      // Check if we're done
      if (isComplete(result)) {
        return result;
      }

      // Check if we'll exceed timeout after next delay
      const elapsed = Date.now() - startTime;
      if (elapsed + delay > timeout) {
        throw new TimeoutError(
          `Polling timeout exceeded after ${attempt} attempts (${elapsed}ms)`,
          408
        );
      }

      // Wait before next poll
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelay);
    } catch (error) {
      // If it's a timeout error we threw, re-throw it
      if (error instanceof TimeoutError) {
        throw error;
      }

      // Allow custom error handling
      if (onError && error instanceof Error) {
        const shouldContinue = onError(error, attempt);
        if (shouldContinue) {
          // Check timeout before continuing
          const elapsed = Date.now() - startTime;
          if (elapsed + delay > timeout) {
            throw new TimeoutError(
              `Polling timeout exceeded after ${attempt} attempts with errors (${elapsed}ms)`,
              408
            );
          }
          await sleep(delay);
          delay = Math.min(delay * backoffFactor, maxDelay);
          continue;
        }
      }

      // Re-throw unhandled errors
      throw error;
    }
  }
}

/**
 * Sleep utility
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a polling configuration for common scenarios
 *
 * @param timeout - Total timeout in milliseconds
 * @returns Pre-configured polling options
 *
 * @example
 * ```typescript
 * const result = await poll({
 *   ...createPollingConfig(60000), // 1 minute
 *   fn: () => checkStatus(),
 *   isComplete: (status) => status === 'complete'
 * });
 * ```
 */
export function createPollingConfig(timeout: number): Pick<PollingOptions<unknown>, 'timeout' | 'initialDelay' | 'maxDelay' | 'backoffFactor'> {
  return {
    timeout,
    initialDelay: 1000,
    maxDelay: Math.min(10000, timeout / 10), // 10% of timeout or 10s
    backoffFactor: 1.5,
  };
}

/**
 * Poll with a simple retry count instead of time-based timeout
 *
 * @template T - Type of the result
 * @param fn - Function to execute
 * @param isComplete - Completion check
 * @param maxAttempts - Maximum number of attempts
 * @param delayMs - Delay between attempts in milliseconds
 * @returns Promise with the result
 *
 * @example
 * ```typescript
 * const result = await pollWithRetries(
 *   () => fetchData(),
 *   (data) => data.ready,
 *   10, // max 10 attempts
 *   2000 // 2 seconds between attempts
 * );
 * ```
 */
export async function pollWithRetries<T>(
  fn: () => Promise<T>,
  isComplete: (result: T) => boolean,
  maxAttempts: number,
  delayMs: number
): Promise<T> {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const result = await fn();

    if (isComplete(result)) {
      return result;
    }

    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }

  throw new Error(`Polling failed after ${maxAttempts} attempts`);
}
