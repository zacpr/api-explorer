import type { OpenAPIV3 } from 'openapi-types';

export interface ApiInstance {
  id: string;
  name: string;
  schemaPath: string;
  baseUrl: string;
  environment?: string;
  defaultHeaders?: Record<string, string>;
  credentialId?: string;
}

export type CredentialType = 'api_key' | 'basic' | 'bearer' | 'oauth2';

export interface Credential {
  id: string;
  type: CredentialType;
  name: string;
}

export interface ApiOperation {
  operationId: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: OpenAPIV3.ParameterObject[];
  requestBody?: OpenAPIV3.RequestBodyObject;
  responses?: OpenAPIV3.ResponsesObject;
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

export interface Bookmark {
  id: string;
  name: string;
  description?: string;
  instanceId: string;
  operationId: string;
  path: string;
  method: HttpMethod;
  parameters: {
    path: Record<string, string>;
    query: Record<string, string>;
    header: Record<string, string>;
    body?: unknown;
    spaceId?: string;
  };
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
  useCount: number;
}

export interface UsageRecord {
  id: string;
  bookmarkId?: string;
  instanceId: string;
  operationId: string;
  method: HttpMethod;
  path: string;
  statusCode?: number;
  responseTimeMs?: number;
  timestamp: number;
  success: boolean;
}

export interface ParsedSchema {
  title?: string;
  version?: string;
  baseUrl: string;
  operations: ApiOperation[];
  tags: string[];
  raw: OpenAPIV3.Document;
}
