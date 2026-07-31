// lib/apiHandler.js
const axios = require('axios');

// IMPORTANT: Vercel Hobby plan force-kills a function at 10s total execution
// time, regardless of vercel.json's maxDuration. If our own axios timeout +
// retries add up to anywhere near 10s, Vercel kills the process mid-flight
// BEFORE our try/catch can return a clean JSON error — this is what
// FUNCTION_INVOCATION_FAILED / "Serverless Function has crashed" actually means.
// So we keep our budget well under 10s and DON'T retry (retrying just adds
// more wait time when the real problem is a slow/unreachable upstream).
const DEFAULT_TIMEOUT_MS = 7000; // 7s — leaves ~3s buffer under the 10s cap
const MAX_RETRIES = 0;           // no retries — fail fast, return clean error
const RETRY_DELAY_MS = 300;

/**
 * Sets standard CORS headers on the response.
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Handles OPTIONS preflight. Returns true if the request was
 * a preflight and has already been responded to.
 */
function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).end();
    return true;
  }
  return false;
}

/**
 * Trims whitespace and safely decodes a query value.
 * Returns undefined if value is missing/empty after trim.
 */
function sanitizeParam(value) {
  if (value === undefined || value === null) return undefined;

  let str = Array.isArray(value) ? value[0] : String(value);
  str = str.trim();

  if (str === '') return undefined;

  // Safely decode in case the value arrives double-encoded
  try {
    const decoded = decodeURIComponent(str);
    return decoded.trim();
  } catch (e) {
    // If decoding fails (malformed %), fall back to raw trimmed string
    return str;
  }
}

/**
 * Resolves a value from multiple possible alias keys in req.query.
 * Returns the first non-empty match after sanitization.
 */
function resolveAlias(query, ...keys) {
  for (const key of keys) {
    const sanitized = sanitizeParam(query[key]);
    if (sanitized !== undefined) return sanitized;
  }
  return undefined;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Performs a GET request with timeout + limited retries.
 * Retries only on network-level failures / no response (not on 4xx from upstream).
 */
async function fetchWithRetry(url, params, options = {}) {
  const timeout = options.timeout || DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? MAX_RETRIES;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, { params, timeout });
      return response;
    } catch (error) {
      lastError = error;

      // If upstream responded (even with an error status), don't retry —
      // retrying won't fix a 4xx/5xx from the remote API itself.
      if (error.response) {
        throw error;
      }

      // Network error / timeout / no response — retry if attempts remain
      if (attempt < maxRetries) {
        await sleep(RETRY_DELAY_MS * (attempt + 1)); // simple backoff
        continue;
      }
    }
  }

  throw lastError;
}

/**
 * Maps an axios/network error into a clean JSON error response.
 */
function sendUpstreamError(res, error) {
  if (error.response) {
    // Upstream server responded with a non-2xx status
    return res.status(error.response.status).json({
      success: false,
      error: 'Upstream server returned an error.',
      details: error.response.data || null
    });
  }

  if (error.code === 'ECONNABORTED') {
    // Axios timeout
    return res.status(504).json({
      success: false,
      error: 'Upstream request timed out.'
    });
  }

  if (error.request) {
    // Request made, no response received (connection refused, DNS fail, etc.)
    return res.status(502).json({
      success: false,
      error: 'Failed to connect to upstream server.'
    });
  }

  // Unexpected internal error
  return res.status(500).json({
    success: false,
    error: 'Internal server error.',
    details: error.message
  });
}

module.exports = {
  setCorsHeaders,
  handlePreflight,
  sanitizeParam,
  resolveAlias,
  fetchWithRetry,
  sendUpstreamError
};
