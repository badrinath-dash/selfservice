// Key improvements:
// 1. Fix retry bug by storing lastErr before continue
// 2. Handle 429 rate limiting
// 3. Better network error detection
// 4. CSRF token validation
// 5. Clearer attempt counting

async function commitIndexStanzaToGitLab(data, options = {}) {
  const {
    timeoutMs = 15000,
    maxRetries = 2,
    initialBackoffMs = 500,
    onDebug,
  } = options;

  // Input validation
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid argument: "data" must be a non-null object.');
  }
  if (!data.indexName || typeof data.indexName !== 'string') {
    throw new Error('Invalid data: "indexName" (string) is required.');
  }
  if (!data.stanzaContent || typeof data.stanzaContent !== 'string') {
    throw new Error('Invalid data: "stanzaContent" (string) is required.');
  }
  if (!config.CSRFToken) {
    throw new Error('CSRF token not available');
  }

  const url = createRESTURL('/gitlab/commit-index-stanza', {
    app: config.app,
    sharing: 'app',
  });

  const headers = {
    'X-Splunk-Form-Key': config.CSRFToken,
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  };

  let attempt = 0;
  let backoff = initialBackoffMs;
  let lastErr;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      onDebug?.({ stage: 'request', attempt, url });

      const res = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timer);

      const responseText = await res.text();
      let parsed;
      try {
        parsed = responseText ? JSON.parse(responseText) : {};
      } catch {
        parsed = { _raw: responseText };
      }

      if (!res.ok) {
        const statusFamily = Math.floor(res.status / 100);
        const errMsg = parsed?.error || parsed?.message || 
          `Git commit failed (${res.status} ${res.statusText})`;

        const error = new Error(errMsg);
        error.name = 'GitLabCommitError';
        error.status = res.status;
        error.statusText = res.statusText;
        error.bodySnippet = responseText.substring(0, 300);
        error.response = parsed;
        error.attempt = attempt;

        lastErr = error; // FIX: Store before retry check

        // Retry on server errors (5xx) or rate limiting (429)
        if ((statusFamily === 5 || res.status === 429) && attempt < maxRetries) {
          onDebug?.({ stage: 'retry', reason: 'server_error', status: res.status, backoffMs: backoff });
          await sleep(backoff);
          backoff *= 2;
          attempt += 1;
          continue;
        }
        throw error;
      }

      onDebug?.({ stage: 'success', attempt, status: res.status });
      return parsed;

    } catch (err) {
      clearTimeout(timer);

      if (err?.name === 'AbortError') {
        const error = new Error(`Request timed out after ${timeoutMs}ms`);
        error.name = 'TimeoutError';
        error.attempt = attempt;
        lastErr = error;

        if (attempt < maxRetries) {
          onDebug?.({ stage: 'retry', reason: 'timeout', backoffMs: backoff });
          await sleep(backoff);
          backoff *= 2;
          attempt += 1;
          continue;
        }
        throw error;
      }

      lastErr = err;
      // Better network error detection
      const isNetworkError = err instanceof TypeError || 
        err?.name === 'FetchError' ||
        err?.message?.toLowerCase().includes('network') ||
        err?.message?.toLowerCase().includes('failed to fetch');

      if (isNetworkError && attempt < maxRetries) {
        onDebug?.({ stage: 'retry', reason: 'network_error', backoffMs: backoff });
        await sleep(backoff);
        backoff *= 2;
        attempt += 1;
        continue;
      }

      throw err;
    }
  }

  throw lastErr ?? new Error('Unknown error in commitIndexStanzaToGitLab');
}
