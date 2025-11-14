/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * HTTP Client Error
 */
export class HttpClientError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'HttpClientError';
    this.status = status;
    this.response = response;
  }
}

/**
 * Default HTTP client configuration
 */
const DEFAULT_CONFIG = {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  retries: 3,
  retryDelay: 1000,
};

/**
 * Make HTTP request using fetch
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
async function makeRequest(url, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const { timeout, retries, retryDelay, ...fetchOptions } = config;

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpClientError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorText,
        );
      }

      // Parse response based on content type
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      if (contentType && contentType.includes('text/')) {
        return await response.text();
      }

      return await response.blob();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) or abort
      if (error.name === 'AbortError' || (error.status && error.status < 500)) {
        throw error;
      }

      // Wait before retry (except on last attempt)
      if (attempt < retries) {
        await new Promise(resolve =>
          setTimeout(resolve, retryDelay * (attempt + 1)),
        );
      }
    }
  }

  clearTimeout(timeoutId);
  throw lastError;
}

/**
 * GET request
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function get(url, options = {}) {
  return makeRequest(url, { ...options, method: 'GET' });
}

/**
 * POST request
 * @param {string} url - Request URL
 * @param {*} data - Request body data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function post(url, data = null, options = {}) {
  const requestOptions = { ...options, method: 'POST' };

  if (data) {
    requestOptions.body =
      typeof data === 'string' ? data : JSON.stringify(data);
  }

  return makeRequest(url, requestOptions);
}

/**
 * PUT request
 * @param {string} url - Request URL
 * @param {*} data - Request body data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function put(url, data = null, options = {}) {
  const requestOptions = { ...options, method: 'PUT' };

  if (data) {
    requestOptions.body =
      typeof data === 'string' ? data : JSON.stringify(data);
  }

  return makeRequest(url, requestOptions);
}

/**
 * PATCH request
 * @param {string} url - Request URL
 * @param {*} data - Request body data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function patch(url, data = null, options = {}) {
  const requestOptions = { ...options, method: 'PATCH' };

  if (data) {
    requestOptions.body =
      typeof data === 'string' ? data : JSON.stringify(data);
  }

  return makeRequest(url, requestOptions);
}

/**
 * DELETE request
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function del(url, options = {}) {
  return makeRequest(url, { ...options, method: 'DELETE' });
}

/**
 * HEAD request
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response headers
 */
export async function head(url, options = {}) {
  const response = await fetch(url, { ...options, method: 'HEAD' });

  if (!response.ok) {
    throw new HttpClientError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  // Convert headers to object
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return headers;
}

/**
 * Upload file using FormData
 * @param {string} url - Upload URL
 * @param {File|Blob} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Response data
 */
export async function uploadFile(url, file, options = {}) {
  const formData = new FormData();
  formData.append('file', file);

  // Add additional fields
  if (options.fields) {
    Object.entries(options.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const requestOptions = {
    ...options,
    method: 'POST',
    body: formData,
    headers: {
      // Remove Content-Type to let browser set it with boundary
      ...options.headers,
    },
  };

  // Remove Content-Type for FormData
  delete requestOptions.headers['Content-Type'];

  return makeRequest(url, requestOptions);
}

/**
 * Download file as blob
 * @param {string} url - Download URL
 * @param {Object} options - Download options
 * @returns {Promise<Blob>} File blob
 */
export async function downloadFile(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new HttpClientError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  return response.blob();
}

/**
 * Create HTTP client with base configuration
 * @param {Object} baseConfig - Base configuration
 * @returns {Object} HTTP client instance
 */
export function createClient(baseConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...baseConfig };

  return {
    get: (url, options = {}) => get(url, { ...config, ...options }),
    post: (url, data, options = {}) =>
      post(url, data, { ...config, ...options }),
    put: (url, data, options = {}) => put(url, data, { ...config, ...options }),
    patch: (url, data, options = {}) =>
      patch(url, data, { ...config, ...options }),
    delete: (url, options = {}) => del(url, { ...config, ...options }),
    head: (url, options = {}) => head(url, { ...config, ...options }),
    upload: (url, file, options = {}) =>
      uploadFile(url, file, { ...config, ...options }),
    download: (url, options = {}) =>
      downloadFile(url, { ...config, ...options }),
  };
}

/**
 * Create authenticated HTTP client
 * @param {string} token - Authentication token
 * @param {string} type - Token type (Bearer, Basic, etc.)
 * @param {Object} baseConfig - Base configuration
 * @returns {Object} Authenticated HTTP client
 */
export function createAuthenticatedClient(
  token,
  type = 'Bearer',
  baseConfig = {},
) {
  const config = {
    ...baseConfig,
    headers: {
      ...baseConfig.headers,
      Authorization: `${type} ${token}`,
    },
  };

  return createClient(config);
}

/**
 * Batch HTTP requests
 * @param {Array} requests - Array of request configurations
 * @param {Object} options - Batch options
 * @returns {Promise<Array>} Array of results
 */
export async function batch(requests, options = {}) {
  const { concurrent = 5, failFast = false } = options;
  const results = [];

  // Process requests in batches
  for (let i = 0; i < requests.length; i += concurrent) {
    const batch = requests.slice(i, i + concurrent);

    const batchPromises = batch.map(async (request, index) => {
      try {
        const { url, method = 'GET', data, ...requestOptions } = request;

        let result;
        switch (method.toLowerCase()) {
          case 'post':
            result = await post(url, data, requestOptions);
            break;
          case 'put':
            result = await put(url, data, requestOptions);
            break;
          case 'patch':
            result = await patch(url, data, requestOptions);
            break;
          case 'delete':
            result = await del(url, requestOptions);
            break;
          default:
            result = await get(url, requestOptions);
        }

        return { success: true, data: result, index: i + index };
      } catch (error) {
        if (failFast) {
          throw error;
        }
        return { success: false, error, index: i + index };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  // Sort results by original index
  return results.sort((a, b) => a.index - b.index);
}

/**
 * Health check utility
 * @param {string} url - Health check URL
 * @param {Object} options - Check options
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck(url, options = {}) {
  const { timeout = 5000 } = options;

  try {
    const start = Date.now();
    await get(url, { timeout });
    const duration = Date.now() - start;

    return {
      status: 'healthy',
      responseTime: duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
