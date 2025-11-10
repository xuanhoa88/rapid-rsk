/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Environment detection
 */
const isServer = typeof window === 'undefined';

/**
 * Custom error class for fetch-related errors with enhanced context
 */
export class FetchError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {string} statusText - HTTP status text
   * @param {string} url - Request URL
   * @param {any} data - Response data if available
   */
  constructor(message, status, statusText, url, data = null) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Configuration options for createFetch
 * @typedef {Object} FetchConfig
 * @property {string} [cookie] - Cookie string for server-side requests
 * @property {Function} [onRequest] - Request interceptor
 * @property {Function} [onResponse] - Response interceptor
 * @property {Function} [onError] - Error interceptor
 */

/**
 * Creates a simple wrapper around the Fetch API for server/client compatibility.
 *
 * Features:
 * - Server/client compatibility (cookies, environment detection)
 * - Request/response/error interceptors
 * - Configurable timeout per-request
 * - Enhanced error handling with FetchError
 *
 * @param {Function} fetch - Native fetch function or polyfill
 * @param {FetchConfig} config - Configuration options
 * @returns {Function} Enhanced fetch function
 *
 * @example
 * const fetch = createFetch(window.fetch, {
 *   onRequest: (url, options) => {
 *     // Add auth token
 *     options.headers.Authorization = 'Bearer token';
 *     return options;
 *   },
 * });
 *
 * // Internal API (goes through proxy)
 * const data = await fetch('/api/users', { timeout: 5000 });
 *
 * // External API (full URL)
 * const data = await fetch('https://external-api.com/data');
 */
export function createFetch(fetch, config = {}) {
  const {
    baseUrl = '',
    cookie = null,
    onRequest = null,
    onResponse = null,
    onError = null,
  } = config;

  /**
   * Default fetch options for internal API requests
   */
  const defaults = {
    method: 'GET',
    mode: 'same-origin',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(isServer && cookie ? { Cookie: cookie } : {}),
    },
  };

  /**
   * Execute fetch with optional timeout using AbortController
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>}
   */
  async function executeRequest(url, options) {
    const timeoutMs = options.timeout;

    // No timeout specified or AbortController not available, use regular fetch
    if (!timeoutMs || typeof AbortController === 'undefined') {
      return fetch(url, options);
    }

    // Use AbortController for proper cancellation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new FetchError(
          `Request timeout after ${timeoutMs}ms`,
          408,
          'Request Timeout',
          url,
        );
      }
      throw error;
    }
  }

  /**
   * Process response and handle errors
   * @param {Response} response - Fetch response
   * @param {string} url - Request URL
   * @returns {Promise<any>}
   */
  async function processResponse(response, url) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let data = null;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (error) {
      // Ignore parsing errors for empty responses (204 No Content)
      if (response.status !== 204) {
        throw error;
      }
    }

    if (!response.ok) {
      throw new FetchError(
        (data && data.message) ||
          `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText,
        url,
        data,
      );
    }

    return data;
  }

  /**
   * Enhanced fetch wrapper
   * Auto-detects absolute URLs vs relative paths
   * @param {string} url - Request URL (absolute or relative)
   * @param {Object} options - Fetch options (can include timeout)
   * @returns {Promise<any>}
   */
  return async function enhancedFetch(url, options = {}) {
    try {
      // Auto-detect: absolute URL (http/https) or relative path
      const isAbsoluteUrl = /^https?:\/\//i.test(url);

      // Construct full URL for relative paths
      const fullUrl = isAbsoluteUrl ? url : `${baseUrl}${url}`;

      // Apply defaults only for relative paths (internal API)
      let mergedOptions = !isAbsoluteUrl
        ? {
            ...defaults,
            ...options,
            headers: {
              ...defaults.headers,
              ...(options.headers || {}),
            },
          }
        : options;

      // Apply request interceptor
      if (typeof onRequest === 'function') {
        mergedOptions = await onRequest(fullUrl, mergedOptions);
      }

      // Execute request (with optional timeout from options)
      const response = await executeRequest(fullUrl, mergedOptions);
      const data = await processResponse(response, fullUrl);

      // Apply response interceptor
      return typeof onResponse === 'function'
        ? await onResponse(data, response)
        : data;
    } catch (error) {
      // Apply error interceptor
      if (typeof onError === 'function') {
        return onError(error);
      }
      throw error;
    }
  };
}
