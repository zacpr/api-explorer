import { loadSchemaFromUrl } from './schemaLoader';
import type { ParsedSchema } from '@/models/types';

export interface SchemaRegistryEntry {
  title: string;
  downloads_to_file: string;
  can_download_from: string;
  example?: boolean;
}

export interface SchemaRegistry {
  schemas: SchemaRegistryEntry[];
}

const REGISTRY_FILE = '/schemas/schema_register.json';

/**
 * Check if a file exists by attempting to fetch it
 * Note: In dev mode, Vite returns index.html for 404s, so we check content-type
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    if (!response.ok) return false;
    
    // Check content-type to ensure it's not the SPA fallback (HTML)
    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('yaml') || contentType.includes('json') || contentType.includes('text');
  } catch {
    return false;
  }
}

/**
 * Load the schema registry
 */
export async function loadSchemaRegistry(): Promise<SchemaRegistry> {
  const response = await fetch(REGISTRY_FILE);
  if (!response.ok) {
    throw new Error(`Failed to load schema registry: ${response.status}`);
  }
  return response.json();
}

/**
 * Load a schema from the registry
 * - If the file exists locally, use it
 * - If not, download from URL and use that
 */
export async function loadSchemaFromRegistry(
  entry: SchemaRegistryEntry
): Promise<ParsedSchema> {
  const filePath = `/schemas/${entry.downloads_to_file}`;
  
  // Check if file exists locally
  const exists = await fileExists(filePath);
  
  if (exists) {
    console.log(`Loading ${entry.title} from local file: ${filePath}`);
    return loadSchemaFromUrl(filePath);
  }
  
  // File doesn't exist, try to download
  if (!entry.can_download_from) {
    throw new Error(
      `Schema file '${entry.downloads_to_file}' not found locally and no download URL provided for '${entry.title}'`
    );
  }
  
  console.log(`Local file not found, downloading ${entry.title} from: ${entry.can_download_from}`);
  
  try {
    // For now, we load directly from the URL
    // In a production app with a backend, we'd save this to the file system
    return loadSchemaFromUrl(entry.can_download_from);
  } catch (error) {
    throw new Error(
      `Failed to load schema '${entry.title}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all non-example schemas from the registry
 */
export function getAvailableSchemas(registry: SchemaRegistry): SchemaRegistryEntry[] {
  return registry.schemas.filter(schema => !schema.example);
}

/**
 * Find a schema by title
 */
export function findSchemaByTitle(
  registry: SchemaRegistry,
  title: string
): SchemaRegistryEntry | undefined {
  return registry.schemas.find(
    schema => schema.title.toLowerCase() === title.toLowerCase() && !schema.example
  );
}

/**
 * Get the default schema (first non-example)
 */
export function getDefaultSchema(registry: SchemaRegistry): SchemaRegistryEntry | undefined {
  return getAvailableSchemas(registry)[0];
}
