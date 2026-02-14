import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIV3 } from 'openapi-types';
import type { ApiOperation, HttpMethod, ParsedSchema } from '@/models/types';
import { parse as parseYaml } from 'yaml';

const VALID_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

/**
 * Load and parse an OpenAPI schema from raw content
 * Tests: P1-01, P1-02, P1-03, P1-04
 */
export async function loadSchema(content: string, format: 'json' | 'yaml' = 'yaml'): Promise<ParsedSchema> {
  const parsed = format === 'json' ? JSON.parse(content) : parseYaml(content);
  
  // Dereference all $refs to get fully resolved schema
  const api = await SwaggerParser.dereference(parsed as any, {
    dereference: { circular: 'ignore' },
  });

  const doc = api as OpenAPIV3.Document;
  const operations = extractOperations(doc);
  const tags = extractUniqueTags(operations);

  return {
    title: doc.info?.title,
    version: doc.info?.version,
    baseUrl: extractBaseUrl(doc),
    operations,
    tags,
    raw: doc,
  };
}

/**
 * Validate a schema without loading fully
 */
export async function validateSchema(path: string): Promise<boolean> {
  try {
    await SwaggerParser.validate(path, {
      validate: { schema: true, spec: true },
    });
    return true;
  } catch {
    return false;
  }
}

function extractOperations(doc: OpenAPIV3.Document): ApiOperation[] {
  const operations: ApiOperation[] = [];
  const paths = doc.paths || {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    for (const method of VALID_METHODS) {
      const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;
      if (!operation) continue;

      const operationId = operation.operationId || generateOperationId(method, path);
      
      operations.push({
        operationId,
        method,
        path,
        summary: operation.summary,
        description: operation.description,
        tags: operation.tags || [],
        parameters: mergeParameters(
          pathItem.parameters as OpenAPIV3.ParameterObject[] | undefined,
          operation.parameters as OpenAPIV3.ParameterObject[] | undefined
        ),
        requestBody: operation.requestBody as OpenAPIV3.RequestBodyObject | undefined,
        responses: operation.responses,
      });
    }
  }

  return operations;
}

function mergeParameters(
  pathParams: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[] | undefined,
  opParams: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[] | undefined
): OpenAPIV3.ParameterObject[] {
  const paramMap = new Map<string, OpenAPIV3.ParameterObject>();
  
  // Helper to check if param is a ReferenceObject
  const isReference = (p: OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject): p is OpenAPIV3.ReferenceObject =>
    '$ref' in p;
  
  // Add path-level params first
  for (const param of pathParams || []) {
    if (isReference(param)) continue; // Skip unresolved refs
    if (param.name && param.in) {
      paramMap.set(`${param.in}:${param.name}`, param);
    }
  }
  
  // Operation params override path params
  for (const param of opParams || []) {
    if (isReference(param)) continue; // Skip unresolved refs
    if (param.name && param.in) {
      paramMap.set(`${param.in}:${param.name}`, param);
    }
  }
  
  return Array.from(paramMap.values());
}

function extractUniqueTags(operations: ApiOperation[]): string[] {
  const tagSet = new Set<string>();
  for (const op of operations) {
    for (const tag of op.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

function extractBaseUrl(doc: OpenAPIV3.Document): string {
  if (doc.servers && doc.servers.length > 0) {
    return doc.servers[0].url;
  }
  return 'http://localhost';
}

function generateOperationId(method: string, path: string): string {
  return `${method.toUpperCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

/**
 * Search operations by keyword
 * Tests: P1-06, P1-07
 */
export function searchOperations(
  operations: ApiOperation[],
  query: string
): ApiOperation[] {
  if (!query.trim()) return operations;
  
  const lowerQuery = query.toLowerCase();
  
  return operations.filter(op => {
    const searchable = [
      op.operationId,
      op.summary,
      op.description,
      op.path,
      ...op.tags,
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchable.includes(lowerQuery);
  });
}

/**
 * Filter operations by tag
 * Test: P1-05
 */
export function filterByTag(
  operations: ApiOperation[],
  tag: string
): ApiOperation[] {
  return operations.filter(op => op.tags.includes(tag));
}

/**
 * Filter operations by HTTP method
 * Test: P1-05 extension
 */
export function filterByMethod(
  operations: ApiOperation[],
  method: HttpMethod
): ApiOperation[] {
  return operations.filter(op => op.method === method);
}
