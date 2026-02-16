import { vi } from 'vitest';

// Mock fetch globally to prevent real HTTP requests
const originalFetch = global.fetch;

export function mockFetch() {
  global.fetch = vi.fn(async (url: string, options?: RequestInit) => {
    const method = options?.method?.toUpperCase() || 'GET';
    
    // httpbin.org/get mock
    if (url.includes('/get')) {
      return new Response(JSON.stringify({
        url,
        headers: {},
        args: {},
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // httpbin.org/post mock
    if (url.includes('/post') && method === 'POST') {
      const body = options?.body;
      return new Response(JSON.stringify({
        url,
        json: body ? JSON.parse(body as string) : null,
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // httpbin.org/status/404 mock
    if (url.includes('/status/404')) {
      return new Response('', { status: 404, statusText: 'Not Found' });
    }
    
    // httpbin.org/status/500 mock
    if (url.includes('/status/500')) {
      return new Response('', { status: 500, statusText: 'Internal Server Error' });
    }
    
    // httpbin.org/delay/5 - simulate slow request
    if (url.includes('/delay/')) {
      // Check if aborted
      if (options?.signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }
      
      // Simulate delay but respect abort signal
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 5000);
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        }
      });
      
      return new Response('{}', { status: 200 });
    }
    
    // httpbin.org/anything mock
    if (url.includes('/anything')) {
      const urlObj = new URL(url);
      return new Response(JSON.stringify({
        url,
        args: Object.fromEntries(urlObj.searchParams),
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Default fallback
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
}

export function restoreFetch() {
  global.fetch = originalFetch;
}
