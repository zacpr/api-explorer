import type { ApiOperation, HttpMethod } from '@/models/types';

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface ResponseData {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  responseTimeMs: number;
}

export interface ExecutionResult {
  success: boolean;
  response?: ResponseData;
  error?: string;
}

/**
 * Build request URL with path and query parameters
 * Tests: P2-01, P2-02
 */
export function buildRequestUrl(
  baseUrl: string,
  path: string,
  pathParams: Record<string, string> = {},
  queryParams: Record<string, string> = {}
): string {
  // Replace path parameters
  let resolvedPath = path;
  for (const [key, value] of Object.entries(pathParams)) {
    resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(value));
  }

  // Build query string
  const queryEntries = Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== '');
  if (queryEntries.length > 0) {
    const queryString = queryEntries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    resolvedPath += `?${queryString}`;
  }

  // Combine with base URL
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`;
  
  return normalizedBase + normalizedPath;
}

/**
 * Build request headers
 * Test: P2-03
 */
export function buildHeaders(
  _operation: ApiOperation,
  headerParams: Record<string, string> = {},
  defaultHeaders: Record<string, string> = {},
  body?: unknown
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Add default headers first
  Object.assign(headers, defaultHeaders);

  // Add header parameters
  for (const [key, value] of Object.entries(headerParams)) {
    if (value !== undefined && value !== '') {
      headers[key] = value;
    }
  }

  // Auto-set Content-Type for JSON body
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  return headers;
}

/**
 * Execute HTTP request
 * Tests: P2-04, P2-05, P2-06, P2-07
 */
export async function executeRequest(
  config: RequestConfig,
  options: { timeout?: number; signal?: AbortSignal; useProxy?: boolean } = {}
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const timeout = options.timeout || 30000;

  // Build proxy URL if needed
  let url = config.url;
  const headers = { ...config.headers };
  
  if (options.useProxy) {
    // Route through Vite dev server proxy
    const targetUrl = new URL(config.url);
    headers['X-Proxy-Target'] = `${targetUrl.protocol}//${targetUrl.host}`;
    url = `/api-proxy${targetUrl.pathname}${targetUrl.search}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Use provided signal or our controller's signal
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const response = await fetch(url, {
      method: config.method.toUpperCase(),
      headers,
      body: config.body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTimeMs = Date.now() - startTime;

    // Parse response body
    let body: unknown;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    // Convert response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      success: response.ok,
      response: {
        statusCode: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body,
        responseTimeMs,
      },
    };
  } catch (error) {
    // Check for abort/timeout using multiple methods for cross-platform compatibility
    const isAbortError = 
      (error instanceof Error && error.name === 'AbortError') ||
      (error instanceof Error && error.message?.includes('abort')) ||
      (error instanceof DOMException && error.name === 'AbortError');
    
    if (isAbortError) {
      return {
        success: false,
        error: 'Request timeout or cancelled',
      };
    }
    
    if (error instanceof Error) {
      // Network errors could be CORS or server not reachable
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: `Network error: Unable to connect to ${config.url}\n\nPossible causes:\n1. Server is not running at the configured base URL\n2. CORS is not enabled on the server\n3. Network connectivity issue`,
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}

/**
 * Execute an API operation
 * Convenience wrapper that builds URL, headers, and executes
 */
export async function executeOperation(
  baseUrl: string,
  operation: ApiOperation,
  params: {
    path?: Record<string, string>;
    query?: Record<string, string>;
    header?: Record<string, string>;
    body?: unknown;
  } = {},
  options: { timeout?: number; signal?: AbortSignal; defaultHeaders?: Record<string, string>; useProxy?: boolean } = {}
): Promise<ExecutionResult> {
  if (!baseUrl || baseUrl.trim() === '') {
    return {
      success: false,
      error: 'Base URL is empty. Please configure an API URL.',
    };
  }
  
  const url = buildRequestUrl(
    baseUrl,
    operation.path,
    params.path,
    params.query
  );

  const headers = buildHeaders(
    operation,
    params.header,
    options.defaultHeaders,
    params.body
  );

  const config: RequestConfig = {
    method: operation.method,
    url,
    headers,
    body: params.body ? JSON.stringify(params.body) : undefined,
  };

  return executeRequest(config, options);
}
