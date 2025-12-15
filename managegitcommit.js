
import * as config from '@splunk/splunk-utils/config';
import { createRESTURL } from '@splunk/splunk-utils/url';

/**
 * Commit an index stanza to GitLab via Splunk REST endpoint (robust JS).
 *
 * @param {object} data - Payload to send. Example:
 *   {
 *     indexName: string,
 *     stanzaContent: string,
 *     commitMessage?: string,
 *     branch?: string
 *   }
 * @param {object} [options]
 * @param {number} [options.timeoutMs=15000] - Request timeout in ms.
 * @param {number} [options.maxRetries=2] - Max retries for transient errors.
 * @param {number} [options.initialBackoffMs=500] - Initial backoff for retries.
 * @param {(info: object) => void} [options.onDebug] - Optional logger hook.
 * @returns {Promise<object>} Resolves to parsed JSON response.
 * @throws {Error} Detailed error including status, body snippet, and context.
 */
async function commitIndexStanzaToGitLab(data, options = {}) {
  // ---- Options & defaults
  const {
    timeoutMs = 15000,
    maxRetries = 2,
    initialBackoffMs = 500,
    onDebug, // (info) => void
  } = options;

  // ---- Basic input validation to fail early with helpful messages
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid argument: "data" must be a non-null object.');
  }
  if (!data.indexName || typeof data.indexName !== 'string') {
    throw new Error('Invalid data: "indexName" (string) is required.');
  }
  if (!data.stanzaContent || typeof data.stanzaContent !== 'string') {
    throw new Error('Invalid data: "stanzaContent" (string) is required.');
  }

  // ---- Construct URL using Splunk helpers
  const url = createRESTURL('/gitlab/commit-index-stanza', {
    app: config.app,
    sharing: 'app',
  });

  // ---- Common headers
  const headers = {
    'X-Splunk-Form-Key': config.CSRFToken,
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  };

  // ---- Retry loop with exponential backoff
  let attempt = 0;
  let backoff = initialBackoffMs;
  let lastErr;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      onDebug?.({
        stage: 'request',
        attempt,
        url,
        headers,
        timeoutMs,
        payloadKeys: Object.keys(data),
      });

      const res = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Try to parse JSON safely; fallback to text
      const rawText = await res.text();
      let parsed;
      try {
        parsed = rawText ? JSON.parse(rawText) : {};
      } catch {
        parsed = { _raw: rawText };
      }

      // Non-2xx handling with helpful errors
      if (!res.ok) {
        const statusFamily = Math.floor(res.status / 100);
        const errMsg =
          parsed?.error ||
          parsed?.message ||
          `Git commit failed (${res.status} ${res.statusText})`;

        const error = new Error(errMsg);
        // Attach context for easier debugging upstream
        error.name = 'GitLabCommitError';
        error.status = res.status;
        error.statusText = res.statusText;
        error.bodySnippet = typeof rawText === 'string' ? rawText.slice(0, 300) : '';
        error.response = parsed;
        error.attempt = attempt;

        // Retry on transient server errors (5xx) or gateway issues
        if (statusFamily === 5 && attempt < maxRetries) {
          onDebug?.({
            stage: 'retry',
            reason: 'server_error',
            status: res.status,
            backoffMs: backoff,
            attempt,
          });
          await sleep(backoff);
          backoff *= 2;
          attempt += 1;
          continue;
        }
        throw error;
      }

      // Success path
      onDebug?.({
        stage: 'success',
        attempt,
        status: res.status,
        keys: parsed ? Object.keys(parsed) : [],
      });

      return parsed; // e.g. { payload: { mergeRequest: { url, iid, title }, ... } }
    } catch (err) {
      clearTimeout(timer);

      // Handle abort/timeout distinctly
      const isAbort = err?.name === 'AbortError';
      if (isAbort) {
        const error = new Error(
          `Request timed out after ${timeoutMs}ms (attempt ${attempt + 1}/${maxRetries + 1}).`
        );
        error.name = 'TimeoutError';
        error.attempt = attempt;
        lastErr = error;

        // Retry on timeout if attempts remain
        if (attempt < maxRetries) {
          onDebug?.({
            stage: 'retry',
            reason: 'timeout',
            backoffMs: backoff,
            attempt,
          });
          await sleep(backoff);
          backoff *= 2;
          attempt += 1;
          continue;
        }
        throw error;
      }

      // Network or other unexpected errors—retry if allowed
      lastErr = err;
      const retriable =
        attempt < maxRetries &&
        (err?.name === 'FetchError' || err?.message?.includes('NetworkError'));

      if (retriable) {
        onDebug?.({
          stage: 'retry',
          reason: 'network_error',
          backoffMs: backoff,
          attempt,
          errorMessage: err?.message,
        });
        await sleep(backoff);
        backoff *= 2;
        attempt += 1;
        continue;
      }

      // Bubble original error when not retriable
      throw err;
    }
  }

  // If we ever exit the loop, throw last encountered error
  throw lastErr ?? new Error('Unknown error in commitIndexStanzaToGitLab');
}

// ---- Small utility for backoff sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { commitIndexStanzaToGitLab };

