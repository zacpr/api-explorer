// Database schema and operations for bookmarks and usage history
// Using in-memory storage for now - will integrate SQLite in full implementation

import type { Bookmark, UsageRecord, Credential } from '@/models/types';

// In-memory storage (replace with SQLite in production)
const bookmarksStore = new Map<string, Bookmark>();
const historyStore = new Map<string, UsageRecord>();
const credentialsStore = new Map<string, Credential>();

/**
 * Bookmark CRUD operations
 * Tests: P3-04, P3-05, P3-06, P3-07, P3-08
 */
export function createBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'useCount'>): Bookmark {
  const now = Date.now();
  const newBookmark: Bookmark = {
    ...bookmark,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    useCount: 0,
  };
  
  bookmarksStore.set(newBookmark.id, newBookmark);
  return newBookmark;
}

export function getBookmark(id: string): Bookmark | undefined {
  return bookmarksStore.get(id);
}

export function updateBookmark(id: string, updates: Partial<Omit<Bookmark, 'id' | 'createdAt'>>): Bookmark | undefined {
  const existing = bookmarksStore.get(id);
  if (!existing) return undefined;
  
  const updated: Bookmark = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  
  bookmarksStore.set(id, updated);
  return updated;
}

export function deleteBookmark(id: string): boolean {
  return bookmarksStore.delete(id);
}

export function listBookmarks(sortBy: 'created' | 'updated' | 'lastUsed' | 'useCount' = 'created'): Bookmark[] {
  const bookmarks = Array.from(bookmarksStore.values());
  
  switch (sortBy) {
    case 'lastUsed':
      return bookmarks.sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
    case 'useCount':
      return bookmarks.sort((a, b) => b.useCount - a.useCount);
    case 'updated':
      return bookmarks.sort((a, b) => b.updatedAt - a.updatedAt);
    case 'created':
    default:
      return bookmarks.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export function recordBookmarkUsage(id: string): void {
  const bookmark = bookmarksStore.get(id);
  if (bookmark) {
    bookmark.useCount++;
    bookmark.lastUsedAt = Date.now();
    bookmark.updatedAt = Date.now();
    bookmarksStore.set(id, bookmark);
  }
}

/**
 * Usage History operations
 * Tests: P3-09, P3-10
 */
export function recordUsage(record: Omit<UsageRecord, 'id' | 'timestamp'>): UsageRecord {
  const newRecord: UsageRecord = {
    ...record,
    id: generateId(),
    timestamp: Date.now(),
  };
  
  historyStore.set(newRecord.id, newRecord);
  return newRecord;
}

export function getUsageHistory(
  options: {
    limit?: number;
    offset?: number;
    instanceId?: string;
    operationId?: string;
  } = {}
): { records: UsageRecord[]; total: number } {
  let records = Array.from(historyStore.values());
  
  if (options.instanceId) {
    records = records.filter(r => r.instanceId === options.instanceId);
  }
  
  if (options.operationId) {
    records = records.filter(r => r.operationId === options.operationId);
  }
  
  // Sort by timestamp descending
  records.sort((a, b) => b.timestamp - a.timestamp);
  
  const total = records.length;
  
  if (options.offset !== undefined || options.limit !== undefined) {
    const offset = options.offset || 0;
    const limit = options.limit || total;
    records = records.slice(offset, offset + limit);
  }
  
  return { records, total };
}

export function clearHistory(): void {
  historyStore.clear();
}

/**
 * Credential metadata operations
 * Note: Actual secrets stored in OS keychain
 * Tests: P3-11
 */
export function storeCredentialMetadata(credential: Omit<Credential, 'id'>): Credential {
  const newCredential: Credential = {
    ...credential,
    id: generateId(),
  };
  
  credentialsStore.set(newCredential.id, newCredential);
  return newCredential;
}

export function getCredentialMetadata(id: string): Credential | undefined {
  return credentialsStore.get(id);
}

export function deleteCredentialMetadata(id: string): boolean {
  return credentialsStore.delete(id);
}

export function listCredentials(): Credential[] {
  return Array.from(credentialsStore.values());
}

/**
 * Statistics
 */
export function getOperationStats(): Array<{
  operationId: string;
  count: number;
  avgResponseTime: number;
  lastUsed: number;
}> {
  const stats = new Map<string, { count: number; totalTime: number; lastUsed: number }>();
  
  for (const record of historyStore.values()) {
    if (!record.success) continue;
    
    const existing = stats.get(record.operationId);
    if (existing) {
      existing.count++;
      existing.totalTime += record.responseTimeMs || 0;
      existing.lastUsed = Math.max(existing.lastUsed, record.timestamp);
    } else {
      stats.set(record.operationId, {
        count: 1,
        totalTime: record.responseTimeMs || 0,
        lastUsed: record.timestamp,
      });
    }
  }
  
  return Array.from(stats.entries()).map(([operationId, data]) => ({
    operationId,
    count: data.count,
    avgResponseTime: Math.round(data.totalTime / data.count),
    lastUsed: data.lastUsed,
  }));
}

// Helper
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clear all data - for testing only
 */
export function __resetDatabase(): void {
  bookmarksStore.clear();
  historyStore.clear();
  credentialsStore.clear();
}
