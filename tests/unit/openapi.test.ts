import { describe, it, expect } from 'vitest';
import { loadSchema, searchOperations, filterByTag, filterByMethod } from '@/services/openapi';
import type { ApiOperation } from '@/models/types';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SCHEMA_DIR = resolve(__dirname, '../../schemas');
const KIBANA_CONTENT = readFileSync(resolve(SCHEMA_DIR, 'kibana-openapi-source.yaml'), 'utf-8');
const ELASTICSEARCH_CONTENT = readFileSync(resolve(SCHEMA_DIR, 'elasticsearch-openapi-source.yaml'), 'utf-8');

describe('Phase 1: Foundation - OpenAPI Parser', () => {
  describe('P1-01: Load Kibana schema without crash', () => {
    it('should parse kibana schema in under 2 seconds', async () => {
      const start = Date.now();
      const result = await loadSchema(KIBANA_CONTENT, 'yaml');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
      expect(result.operations.length).toBeGreaterThan(500);
    });
  });

  describe('P1-02: Load Elasticsearch schema without crash', () => {
    it('should parse elasticsearch schema in under 2 seconds', async () => {
      const start = Date.now();
      const result = await loadSchema(ELASTICSEARCH_CONTENT, 'yaml');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
      expect(result.operations.length).toBeGreaterThan(400);
    });
  });

  describe('P1-03: Handle circular $refs gracefully', () => {
    it('should not hang or crash on schemas with circular references', async () => {
      // The kibana schema has circular refs - this test passes if it doesn't timeout
      const result = await loadSchema(KIBANA_CONTENT, 'yaml');
      expect(result).toBeDefined();
      expect(result.operations.length).toBeGreaterThan(0);
    });
  });

  describe('P1-04: Extract operations with resolved parameters', () => {
    it('should extract operations with all required fields', async () => {
      const result = await loadSchema(KIBANA_CONTENT, 'yaml');
      
      // Check first operation has all required fields
      const firstOp = result.operations[0];
      expect(firstOp).toHaveProperty('operationId');
      expect(firstOp).toHaveProperty('method');
      expect(firstOp).toHaveProperty('path');
      expect(firstOp).toHaveProperty('tags');
      expect(firstOp).toHaveProperty('parameters');
      expect(Array.isArray(firstOp.tags)).toBe(true);
      expect(Array.isArray(firstOp.parameters)).toBe(true);
    });

    it('should merge path and operation parameters correctly', async () => {
      const result = await loadSchema(KIBANA_CONTENT, 'yaml');
      
      // Find an operation that should have both path and operation params
      const op = result.operations.find(o => 
        o.path.includes('{') && o.parameters.length > 0
      );
      
      if (op) {
        expect(op.parameters.every(p => p.name && p.in)).toBe(true);
      }
    });
  });

  describe('P1-05: Filter operations by tag', () => {
    it('should return only operations with specified tag', () => {
      const operations: ApiOperation[] = [
        {
          operationId: 'op1',
          method: 'get',
          path: '/test1',
          tags: ['cluster'],
          parameters: [],
        },
        {
          operationId: 'op2',
          method: 'get',
          path: '/test2',
          tags: ['indices'],
          parameters: [],
        },
        {
          operationId: 'op3',
          method: 'post',
          path: '/test3',
          tags: ['cluster'],
          parameters: [],
        },
      ];

      const filtered = filterByTag(operations, 'cluster');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(op => op.tags.includes('cluster'))).toBe(true);
    });

    it('should return empty array for non-existent tag', () => {
      const operations: ApiOperation[] = [
        {
          operationId: 'op1',
          method: 'get',
          path: '/test1',
          tags: ['cluster'],
          parameters: [],
        },
      ];

      const filtered = filterByTag(operations, 'nonexistent');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('P1-06: Search operations by keyword', () => {
    it('should find operations matching operationId', () => {
      const operations: ApiOperation[] = [
        {
          operationId: 'getIndex',
          method: 'get',
          path: '/index',
          tags: [],
          parameters: [],
        },
        {
          operationId: 'deleteUser',
          method: 'delete',
          path: '/users',
          tags: [],
          parameters: [],
        },
      ];

      const results = searchOperations(operations, 'index');
      expect(results).toHaveLength(1);
      expect(results[0].operationId).toBe('getIndex');
    });

    it('should find operations matching summary', () => {
      const operations: ApiOperation[] = [
        {
          operationId: 'op1',
          method: 'get',
          path: '/test',
          summary: 'Get all indices',
          tags: [],
          parameters: [],
        },
        {
          operationId: 'op2',
          method: 'get',
          path: '/other',
          summary: 'Get users',
          tags: [],
          parameters: [],
        },
      ];

      const results = searchOperations(operations, 'indices');
      expect(results).toHaveLength(1);
      expect(results[0].summary).toContain('indices');
    });

    it('should find operations matching description', () => {
      const operations: ApiOperation[] = [
        {
          operationId: 'op1',
          method: 'get',
          path: '/test',
          description: 'This retrieves cluster health information',
          tags: [],
          parameters: [],
        },
      ];

      const results = searchOperations(operations, 'cluster health');
      expect(results).toHaveLength(1);
    });

    it('should find operations matching path', () => {
      const operations: ApiOperation[] = [
        {
          operationId: 'op1',
          method: 'get',
          path: '/cluster/health',
          tags: [],
          parameters: [],
        },
        {
          operationId: 'op2',
          method: 'get',
          path: '/users/list',
          tags: [],
          parameters: [],
        },
      ];

      const results = searchOperations(operations, 'cluster');
      expect(results).toHaveLength(1);
      expect(results[0].path).toContain('cluster');
    });

    it('should find operations matching tags', () => {
      const operations: ApiOperation[] = [
        {
          operationId: 'op1',
          method: 'get',
          path: '/test',
          tags: ['cluster', 'monitoring'],
          parameters: [],
        },
      ];

      const results = searchOperations(operations, 'monitoring');
      expect(results).toHaveLength(1);
    });
  });

  describe('P1-07: Search is case-insensitive', () => {
    it('should return same results for UPPER and lower case', () => {
      const operations: ApiOperation[] = [
        {
          operationId: 'getIndexSettings',
          method: 'get',
          path: '/index/settings',
          summary: 'INDEX configuration',
          tags: ['INDEX'],
          parameters: [],
        },
      ];

      const resultsLower = searchOperations(operations, 'index');
      const resultsUpper = searchOperations(operations, 'INDEX');
      
      expect(resultsLower).toHaveLength(1);
      expect(resultsUpper).toHaveLength(1);
    });
  });

  describe('Filter by HTTP Method (P1-05 extension)', () => {
    it('should filter operations by method', () => {
      const operations: ApiOperation[] = [
        { operationId: 'op1', method: 'get', path: '/test', tags: [], parameters: [] },
        { operationId: 'op2', method: 'post', path: '/test', tags: [], parameters: [] },
        { operationId: 'op3', method: 'get', path: '/other', tags: [], parameters: [] },
      ];

      const getOps = filterByMethod(operations, 'get');
      expect(getOps).toHaveLength(2);
      expect(getOps.every(op => op.method === 'get')).toBe(true);
    });
  });

  describe('P1-10: Empty search shows all operations', () => {
    it('should return all operations for empty string', () => {
      const operations: ApiOperation[] = [
        { operationId: 'op1', method: 'get', path: '/test1', tags: [], parameters: [] },
        { operationId: 'op2', method: 'get', path: '/test2', tags: [], parameters: [] },
      ];

      const results = searchOperations(operations, '');
      expect(results).toHaveLength(2);
    });

    it('should return all operations for whitespace-only string', () => {
      const operations: ApiOperation[] = [
        { operationId: 'op1', method: 'get', path: '/test1', tags: [], parameters: [] },
      ];

      const results = searchOperations(operations, '   ');
      expect(results).toHaveLength(1);
    });
  });
});
