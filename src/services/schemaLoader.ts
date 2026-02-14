/**
 * Schema loader that works in both browser and Node environments
 */

import { loadSchema as parseSchema } from './openapi';
import type { ParsedSchema } from '@/models/types';

/**
 * Load schema from a URL (works in browser)
 */
export async function loadSchemaFromUrl(url: string): Promise<ParsedSchema> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.statusText}`);
  }
  
  const content = await response.text();
  const format = url.endsWith('.json') ? 'json' : 'yaml';
  
  return parseSchema(content, format);
}

/**
 * Load schema from file content (works in tests/Node)
 */
export { parseSchema as loadSchemaFromContent };

/**
 * Load schema with automatic detection of environment
 * Falls back to fetch in browser, direct load in Node
 */
export async function loadSchema(source: string): Promise<ParsedSchema> {
  // If it looks like a URL or path, try to fetch
  if (source.startsWith('http') || source.startsWith('/')) {
    return loadSchemaFromUrl(source);
  }
  
  // Assume it's raw content (for tests)
  return parseSchema(source, 'yaml');
}
