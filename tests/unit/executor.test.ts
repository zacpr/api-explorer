import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  buildRequestUrl,
  buildHeaders,
  executeRequest,
  executeOperation,
} from '@/services/executor';
import type { ApiOperation } from '@/models/types';
import { mockFetch, restoreFetch } from './setup';

describe('Phase 2: Execution', () => {
  beforeAll(() => {
    mockFetch();
  });
  
  afterAll(() => {
    restoreFetch();
  });
  describe('P2-01: Build request with path parameters', () => {
    it('should replace path parameters', () => {
      const url = buildRequestUrl(
        'https://api.example.com',
        '/items/{id}',
        { id: '123' },
        {}
      );
      expect(url).toBe('https://api.example.com/items/123');
    });

    it('should handle multiple path parameters', () => {
      const url = buildRequestUrl(
        'https://api.example.com',
        '/users/{userId}/orders/{orderId}',
        { userId: '42', orderId: '99' },
        {}
      );
      expect(url).toBe('https://api.example.com/users/42/orders/99');
    });

    it('should URL-encode path parameters', () => {
      const url = buildRequestUrl(
        'https://api.example.com',
        '/search/{query}',
        { query: 'hello world' },
        {}
      );
      expect(url).toBe('https://api.example.com/search/hello%20world');
    });
  });

  describe('P2-02: Build request with query parameters', () => {
    it('should append query parameters', () => {
      const url = buildRequestUrl(
        'https://api.example.com',
        '/items',
        {},
        { page: '1', limit: '10' }
      );
      expect(url).toBe('https://api.example.com/items?page=1&limit=10');
    });

    it('should handle empty query parameters', () => {
      const url = buildRequestUrl(
        'https://api.example.com',
        '/items',
        {},
        {}
      );
      expect(url).toBe('https://api.example.com/items');
    });

    it('should skip undefined/empty query values', () => {
      const url = buildRequestUrl(
        'https://api.example.com',
        '/items',
        {},
        { page: '1', filter: '' }
      );
      expect(url).toBe('https://api.example.com/items?page=1');
    });

    it('should URL-encode query parameters', () => {
      const url = buildRequestUrl(
        'https://api.example.com',
        '/search',
        {},
        { q: 'hello world' }
      );
      expect(url).toBe('https://api.example.com/search?q=hello%20world');
    });

    it('should combine path and query parameters', () => {
      const url = buildRequestUrl(
        'https://api.example.com',
        '/users/{id}/posts',
        { id: '123' },
        { page: '1' }
      );
      expect(url).toBe('https://api.example.com/users/123/posts?page=1');
    });
  });

  describe('P2-03: Build request with headers', () => {
    const mockOperation: ApiOperation = {
      operationId: 'test',
      method: 'get',
      path: '/test',
      tags: [],
      parameters: [],
    };

    it('should add custom headers', () => {
      const headers = buildHeaders(mockOperation, { 'X-Custom': 'value' }, {}, undefined);
      expect(headers['X-Custom']).toBe('value');
    });

    it('should add default headers', () => {
      const headers = buildHeaders(mockOperation, {}, { 'Authorization': 'Bearer token' }, undefined);
      expect(headers['Authorization']).toBe('Bearer token');
    });

    it('should override default headers with custom headers', () => {
      const headers = buildHeaders(
        mockOperation,
        { 'Authorization': 'Custom token' },
        { 'Authorization': 'Bearer token' },
        undefined
      );
      expect(headers['Authorization']).toBe('Custom token');
    });

    it('should auto-set Content-Type for JSON body', () => {
      const headers = buildHeaders(mockOperation, {}, {}, { name: 'test' });
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should not override explicit Content-Type', () => {
      const headers = buildHeaders(mockOperation, { 'Content-Type': 'application/xml' }, {}, { name: 'test' });
      expect(headers['Content-Type']).toBe('application/xml');
    });

    it('should skip empty header values', () => {
      const headers = buildHeaders(mockOperation, { 'X-Empty': '' }, {}, undefined);
      expect(headers['X-Empty']).toBeUndefined();
    });
  });

  describe('P2-04: Execute GET request successfully', () => {
    it('should execute GET to httpbin.org/get and return 200', async () => {
      const result = await executeRequest({
        method: 'get',
        url: 'https://httpbin.org/get',
        headers: {},
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.response!.statusCode).toBe(200);
      expect(result.response!.responseTimeMs).toBeGreaterThan(0);
      expect(result.response!.body).toBeDefined();
    });
  });

  describe('P2-05: Execute POST with JSON body', () => {
    it('should POST JSON and receive echoed body', async () => {
      const testData = { name: 'test', value: 123 };
      
      const result = await executeRequest({
        method: 'post',
        url: 'https://httpbin.org/post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      expect(result.success).toBe(true);
      expect(result.response!.statusCode).toBe(200);
      
      const body = result.response!.body as any;
      expect(body.json).toEqual(testData);
    });
  });

  describe('P2-06: Handle 4xx errors gracefully', () => {
    it('should handle 404 without crashing', async () => {
      const result = await executeRequest({
        method: 'get',
        url: 'https://httpbin.org/status/404',
        headers: {},
      });

      expect(result.success).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response!.statusCode).toBe(404);
      expect(result.error).toBeUndefined();
    });

    it('should handle 500 error', async () => {
      const result = await executeRequest({
        method: 'get',
        url: 'https://httpbin.org/status/500',
        headers: {},
      });

      expect(result.success).toBe(false);
      expect(result.response!.statusCode).toBe(500);
    });
  });

  describe('P2-07: Handle network timeout', () => {
    it('should timeout on slow requests', async () => {
      const result = await executeRequest({
        method: 'get',
        url: 'https://httpbin.org/delay/5',
        headers: {},
      }, { timeout: 100 }); // 100ms timeout

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('P2-08: Cancel in-flight request', () => {
    it('should cancel request when aborted', async () => {
      const controller = new AbortController();
      
      // Start request and immediately abort
      const promise = executeRequest({
        method: 'get',
        url: 'https://httpbin.org/delay/5',
        headers: {},
      }, { signal: controller.signal });
      
      controller.abort();
      
      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toContain('cancelled');
    });
  });

  describe('executeOperation convenience wrapper', () => {
    const mockOperation: ApiOperation = {
      operationId: 'getAnything',
      method: 'get',
      path: '/anything',
      tags: [],
      parameters: [
        { name: 'expand', in: 'query', schema: { type: 'string' } },
      ],
    };

    it('should build and execute request from operation', async () => {
      const result = await executeOperation(
        'https://httpbin.org',
        mockOperation,
        { query: { expand: 'true' } }
      );

      expect(result.success).toBe(true);
      const body = result.response!.body as any;
      expect(body.args).toEqual({ expand: 'true' });
    });
  });
});
