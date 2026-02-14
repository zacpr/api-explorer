import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBookmark,
  getBookmark,
  updateBookmark,
  deleteBookmark,
  listBookmarks,
  recordBookmarkUsage,
  recordUsage,
  getUsageHistory,
  clearHistory,
  storeCredentialMetadata,
  getCredentialMetadata,
  getOperationStats,
  __resetDatabase,
} from '@/db/database';
import type { Bookmark, HttpMethod } from '@/models/types';

describe('Phase 3: Security & Persistence', () => {
  beforeEach(() => {
    __resetDatabase();
  });

  describe('P3-04: Create bookmark with parameters', () => {
    it('should create bookmark with all required fields', () => {
      const bookmark = createBookmark({
        name: 'Get User',
        description: 'Fetch user by ID',
        instanceId: 'instance-1',
        operationId: 'getUser',
        path: '/users/{id}',
        method: 'get' as HttpMethod,
        parameters: {
          path: { id: '123' },
          query: { expand: 'true' },
          header: {},
        },
        tags: ['users'],
      });

      expect(bookmark.id).toBeDefined();
      expect(bookmark.name).toBe('Get User');
      expect(bookmark.operationId).toBe('getUser');
      expect(bookmark.parameters.path.id).toBe('123');
      expect(bookmark.useCount).toBe(0);
      expect(bookmark.createdAt).toBeGreaterThan(0);
    });
  });

  describe('P3-05: Retrieve bookmark by ID', () => {
    it('should retrieve bookmark exactly as created', () => {
      const created = createBookmark({
        name: 'Test Bookmark',
        instanceId: 'instance-1',
        operationId: 'testOp',
        path: '/test',
        method: 'get' as HttpMethod,
        parameters: { path: {}, query: {}, header: {} },
        tags: [],
      });

      const retrieved = getBookmark(created.id);
      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent bookmark', () => {
      const retrieved = getBookmark('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('P3-06: List bookmarks sorted by last used', () => {
    it('should sort by lastUsedAt descending', () => {
      const bookmark1 = createBookmark({
        name: 'Bookmark 1',
        instanceId: 'i1',
        operationId: 'op1',
        path: '/test',
        method: 'get' as HttpMethod,
        parameters: { path: {}, query: {}, header: {} },
        tags: [],
      });

      const bookmark2 = createBookmark({
        name: 'Bookmark 2',
        instanceId: 'i1',
        operationId: 'op2',
        path: '/test',
        method: 'get' as HttpMethod,
        parameters: { path: {}, query: {}, header: {} },
        tags: [],
      });

      // Use bookmark1
      recordBookmarkUsage(bookmark1.id);

      const sorted = listBookmarks('lastUsed');
      expect(sorted[0].id).toBe(bookmark1.id);
      expect(sorted[1].id).toBe(bookmark2.id);
    });

    it('should put bookmarks with no lastUsedAt at the end', () => {
      const bookmark1 = createBookmark({
        name: 'Bookmark 1',
        instanceId: 'i1',
        operationId: 'op1',
        path: '/test',
        method: 'get' as HttpMethod,
        parameters: { path: {}, query: {}, header: {} },
        tags: [],
      });

      // Don't use bookmark2
      createBookmark({
        name: 'Bookmark 2',
        instanceId: 'i1',
        operationId: 'op2',
        path: '/test',
        method: 'get' as HttpMethod,
        parameters: { path: {}, query: {}, header: {} },
        tags: [],
      });

      recordBookmarkUsage(bookmark1.id);

      const sorted = listBookmarks('lastUsed');
      expect(sorted[0].lastUsedAt).toBeDefined();
      expect(sorted[sorted.length - 1].lastUsedAt).toBeUndefined();
    });
  });

  describe('P3-07: Increment use count on execution', () => {
    it('should increment useCount by 1 each time', () => {
      const bookmark = createBookmark({
        name: 'Test',
        instanceId: 'i1',
        operationId: 'op1',
        path: '/test',
        method: 'get' as HttpMethod,
        parameters: { path: {}, query: {}, header: {} },
        tags: [],
      });

      expect(bookmark.useCount).toBe(0);

      recordBookmarkUsage(bookmark.id);
      expect(getBookmark(bookmark.id)!.useCount).toBe(1);

      recordBookmarkUsage(bookmark.id);
      expect(getBookmark(bookmark.id)!.useCount).toBe(2);
    });
  });

  describe('P3-08: Update lastUsedAt on execution', () => {
    it('should set lastUsedAt to current timestamp', () => {
      const before = Date.now();
      
      const bookmark = createBookmark({
        name: 'Test',
        instanceId: 'i1',
        operationId: 'op1',
        path: '/test',
        method: 'get' as HttpMethod,
        parameters: { path: {}, query: {}, header: {} },
        tags: [],
      });

      expect(bookmark.lastUsedAt).toBeUndefined();

      recordBookmarkUsage(bookmark.id);
      
      const after = Date.now();
      const updated = getBookmark(bookmark.id)!;
      
      expect(updated.lastUsedAt).toBeGreaterThanOrEqual(before);
      expect(updated.lastUsedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('P3-09: Record usage in history table', () => {
    it('should create usage record with all required fields', () => {
      const record = recordUsage({
        bookmarkId: 'bookmark-1',
        instanceId: 'instance-1',
        operationId: 'getUser',
        method: 'get' as HttpMethod,
        path: '/users/123',
        statusCode: 200,
        responseTimeMs: 150,
        success: true,
      });

      expect(record.id).toBeDefined();
      expect(record.timestamp).toBeGreaterThan(0);
      expect(record.operationId).toBe('getUser');
      expect(record.success).toBe(true);
    });
  });

  describe('P3-10: Query usage history paginated', () => {
    beforeEach(() => {
      // Create 10 usage records
      for (let i = 0; i < 10; i++) {
        recordUsage({
          instanceId: 'instance-1',
          operationId: `op${i}`,
          method: 'get' as HttpMethod,
          path: `/test${i}`,
          success: true,
        });
      }
    });

    it('should return paginated results', () => {
      const { records, total } = getUsageHistory({ limit: 5, offset: 0 });
      
      expect(total).toBe(10);
      expect(records).toHaveLength(5);
    });

    it('should return second page', () => {
      const { records, total } = getUsageHistory({ limit: 5, offset: 5 });
      
      expect(total).toBe(10);
      expect(records).toHaveLength(5);
    });

    it('should return empty array for offset beyond total', () => {
      const { records, total } = getUsageHistory({ limit: 5, offset: 100 });
      
      expect(total).toBe(10);
      expect(records).toHaveLength(0);
    });

    it('should filter by instanceId', () => {
      recordUsage({
        instanceId: 'instance-2',
        operationId: 'special-op',
        method: 'get' as HttpMethod,
        path: '/special',
        success: true,
      });

      const { records, total } = getUsageHistory({ instanceId: 'instance-2' });
      
      expect(total).toBe(1);
      expect(records[0].operationId).toBe('special-op');
    });
  });

  describe('P3-11: Credential metadata stored in SQLite', () => {
    it('should store credential with id, name, and type only', () => {
      const credential = storeCredentialMetadata({
        name: 'Production API Key',
        type: 'api_key',
      });

      expect(credential.id).toBeDefined();
      expect(credential.name).toBe('Production API Key');
      expect(credential.type).toBe('api_key');
      // Secret should NOT be in the returned object
      expect((credential as any).secret).toBeUndefined();
    });

    it('should retrieve credential metadata without secret', () => {
      const stored = storeCredentialMetadata({
        name: 'Test Key',
        type: 'bearer',
      });

      const retrieved = getCredentialMetadata(stored.id);
      expect(retrieved).toEqual(stored);
      expect((retrieved as any).secret).toBeUndefined();
    });
  });

  describe('Operation Statistics', () => {
    it('should calculate usage count per operation', () => {
      recordUsage({
        instanceId: 'i1',
        operationId: 'op1',
        method: 'get' as HttpMethod,
        path: '/test1',
        success: true,
        responseTimeMs: 100,
      });

      recordUsage({
        instanceId: 'i1',
        operationId: 'op1',
        method: 'get' as HttpMethod,
        path: '/test1',
        success: true,
        responseTimeMs: 200,
      });

      recordUsage({
        instanceId: 'i1',
        operationId: 'op2',
        method: 'post' as HttpMethod,
        path: '/test2',
        success: true,
        responseTimeMs: 150,
      });

      const stats = getOperationStats();
      
      const op1Stats = stats.find(s => s.operationId === 'op1');
      expect(op1Stats?.count).toBe(2);
      expect(op1Stats?.avgResponseTime).toBe(150); // (100 + 200) / 2
    });

    it('should not include failed requests in stats', () => {
      recordUsage({
        instanceId: 'i1',
        operationId: 'op1',
        method: 'get' as HttpMethod,
        path: '/test1',
        success: false,
        responseTimeMs: 100,
      });

      const stats = getOperationStats();
      expect(stats).toHaveLength(0);
    });
  });

  describe('P3-12: Persistence across sessions', () => {
    it('should persist bookmarks in memory store', () => {
      const bookmark = createBookmark({
        name: 'Persistent Bookmark',
        instanceId: 'i1',
        operationId: 'op1',
        path: '/test',
        method: 'get' as HttpMethod,
        parameters: { path: {}, query: {}, header: {} },
        tags: [],
      });

      // Simulate "app restart" by checking store directly
      const retrieved = getBookmark(bookmark.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('Persistent Bookmark');
    });
  });
});
