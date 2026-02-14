import { useState, useEffect, useRef } from 'react';
import { executeOperation, type ExecutionResult } from '@/services/executor';
import { createBookmark, recordBookmarkUsage } from '@/db/database';
import { JsonHighlighter } from '@/utils';
import type { ApiOperation, HttpMethod } from '@/models/types';

interface OperationDetailProps {
  operation: ApiOperation;
  baseUrl?: string;
  useProxy?: boolean;
}

const AUTH_STORAGE_KEY = 'api-explorer-auth';

interface SavedAuth {
  authType: 'none' | 'apiKey' | 'basic';
  apiKey: string;
  username: string;
  // Note: password is NOT saved for security
}

function loadAuth(): SavedAuth {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore storage errors
  }
  return { authType: 'none', apiKey: '', username: '' };
}

function saveAuth(auth: SavedAuth) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // Ignore storage errors
  }
}

function OperationDetail({ operation, baseUrl = 'http://localhost:9200', useProxy = false }: OperationDetailProps) {
  const savedAuth = loadAuth();
  
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [headerParams, _setHeaderParams] = useState<Record<string, string>>({});
  const [body, setBody] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(savedAuth.apiKey);
  const [authType, setAuthType] = useState<'none' | 'apiKey' | 'basic'>(savedAuth.authType);
  const [username, setUsername] = useState<string>(savedAuth.username);
  const [password, setPassword] = useState<string>('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'body'>('params');
  const [spaceAware, setSpaceAware] = useState(false);
  const [spaceId, setSpaceId] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save auth settings when they change (except password)
  useEffect(() => {
    saveAuth({ authType, apiKey, username });
  }, [authType, apiKey, username]);

  const pathParamDefs = operation.parameters.filter(p => p.in === 'path');
  const queryParamDefs = operation.parameters.filter(p => p.in === 'query');
  const hasBody = ['post', 'put', 'patch'].includes(operation.method);

  const handleExecute = async () => {
    setIsExecuting(true);
    setResult(null);
    setShowResponse(false);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    let execResult: ExecutionResult | null = null;
    const headers: Record<string, string> = { ...headerParams };

    try {
      // Add auth headers
      if (authType === 'apiKey' && apiKey) {
        headers['Authorization'] = `ApiKey ${apiKey}`;
      } else if (authType === 'basic' && username) {
        const encoded = btoa(`${username}:${password}`);
        headers['Authorization'] = `Basic ${encoded}`;
      }

      // Parse body if provided
      let parsedBody: unknown;
      if (body) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          execResult = {
            success: false,
            error: 'Invalid JSON in request body',
          };
          setResult(execResult);
          return;
        }
      }

      // Build space-aware path prefix
      const spacePrefix = spaceAware && spaceId ? `/s/${spaceId}` : '';
      const modifiedOperation = {
        ...operation,
        path: spacePrefix + operation.path,
      };

      execResult = await executeOperation(
        baseUrl,
        modifiedOperation,
        {
          path: pathParams,
          query: queryParams,
          header: headers,
          body: parsedBody,
        },
        { timeout: 30000, signal: abortControllerRef.current.signal, useProxy }
      );

      setResult(execResult);
      setShowResponse(true);
    } catch (error) {
      // Catch any unexpected errors
      execResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred',
      };
      setResult(execResult);
    } finally {
      setIsExecuting(false);
      abortControllerRef.current = null;
    }

    // Record usage if successful
    if (execResult?.success) {
      // Create a temporary bookmark for history
      try {
        const bookmark = createBookmark({
          name: operation.operationId,
          instanceId: 'default',
          operationId: operation.operationId,
          path: operation.path,
          method: operation.method as HttpMethod,
          parameters: {
            path: pathParams,
            query: queryParams,
            header: headers,
          },
          tags: [],
        });
        recordBookmarkUsage(bookmark.id);
      } catch {
        // Ignore bookmark errors - don't fail the API call
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleSaveBookmark = () => {
    const headers: Record<string, string> = { ...headerParams };
    if (authType === 'apiKey' && apiKey) {
      headers['Authorization'] = `ApiKey ${apiKey}`;
    } else if (authType === 'basic' && username) {
      const encoded = btoa(`${username}:${password}`);
      headers['Authorization'] = `Basic ${encoded}`;
    }

    // Include space info in bookmark name if space-aware
    const spaceSuffix = spaceAware && spaceId ? ` [space: ${spaceId}]` : '';

    createBookmark({
      name: `${operation.operationId}${spaceSuffix}`,
      description: operation.summary,
      instanceId: 'default',
      operationId: operation.operationId,
      path: operation.path,
      method: operation.method as HttpMethod,
      parameters: {
        path: pathParams,
        query: queryParams,
        header: headers,
        body: body ? JSON.parse(body) : undefined,
        spaceId: spaceAware ? spaceId : undefined,
      },
      tags: operation.tags,
    });

    alert('Bookmark saved!');
  };

  const handleClearResult = () => {
    setResult(null);
    setShowResponse(false);
  };

  return (
    <div className="operation-detail">
      <div className="operation-header">
        <div className="operation-title">
          <span className={`method-badge ${operation.method}`}>
            {operation.method.toUpperCase()}
          </span>
          <h2>{operation.operationId}</h2>
        </div>

        <div className="operation-path">{operation.path}</div>

        {operation.summary && (
          <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
            {operation.summary}
          </div>
        )}

        {operation.description && (
          <div className="operation-description">{operation.description}</div>
        )}

        {operation.tags.length > 0 && (
          <div className="tags-container">
            {operation.tags.map(tag => (
              <span key={tag} className="tag-badge">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'params' ? 'active' : ''}`}
          onClick={() => setActiveTab('params')}
        >
          Parameters
          {(pathParamDefs.length + queryParamDefs.length) > 0 && (
            <span className="tab-badge">{pathParamDefs.length + queryParamDefs.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          Auth
        </button>
        {hasBody && (
          <button
            className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => setActiveTab('body')}
          >
            Body
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'params' && (
          <div className="params-section">
            {/* Kibana Space Selector */}
            <div className="param-group space-section">
              <h4>🚀 Kibana Space</h4>
              <div className="space-toggle-row">
                <label className="space-toggle">
                  <input
                    type="checkbox"
                    checked={spaceAware}
                    onChange={(e) => setSpaceAware(e.target.checked)}
                  />
                  <span>Space-aware request</span>
                </label>
              </div>
              {spaceAware && (
                <div className="space-input-row">
                  <label>
                    Space ID
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={spaceId}
                    onChange={(e) => setSpaceId(e.target.value)}
                    placeholder="default"
                  />
                  <small>Path will be prefixed with /s/{spaceId || '{spaceId}'}/</small>
                </div>
              )}
            </div>

            {pathParamDefs.length > 0 && (
              <div className="param-group">
                <h4>Path Parameters</h4>
                {pathParamDefs.map(param => (
                  <div key={param.name} className="param-input-row">
                    <label>
                      {param.name}
                      {param.required && <span className="required">*</span>}
                      <span className="param-type">{((param.schema as Record<string, unknown>)?.type as string) || 'string'}</span>
                    </label>
                    <input
                      type="text"
                      value={pathParams[param.name] || ''}
                      onChange={(e) => setPathParams({ ...pathParams, [param.name]: e.target.value })}
                      placeholder={param.description || `{${param.name}}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {queryParamDefs.length > 0 && (
              <div className="param-group">
                <h4>Query Parameters</h4>
                {queryParamDefs.map(param => (
                  <div key={param.name} className="param-input-row">
                    <label>
                      {param.name}
                      {param.required && <span className="required">*</span>}
                      <span className="param-type">{((param.schema as Record<string, unknown>)?.type as string) || 'string'}</span>
                    </label>
                    <input
                      type="text"
                      value={queryParams[param.name] || ''}
                      onChange={(e) => setQueryParams({ ...queryParams, [param.name]: e.target.value })}
                      placeholder={param.description || param.name}
                    />
                  </div>
                ))}
              </div>
            )}

            {pathParamDefs.length === 0 && queryParamDefs.length === 0 && (
              <div className="empty-params">No parameters required for this operation</div>
            )}
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="auth-section">
            <div className="auth-type-selector">
              <label className={`auth-option ${authType === 'none' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="none"
                  checked={authType === 'none'}
                  onChange={() => setAuthType('none')}
                />
                <span>No Auth</span>
              </label>
              <label className={`auth-option ${authType === 'apiKey' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="apiKey"
                  checked={authType === 'apiKey'}
                  onChange={() => setAuthType('apiKey')}
                />
                <span>API Key</span>
              </label>
              <label className={`auth-option ${authType === 'basic' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="basic"
                  checked={authType === 'basic'}
                  onChange={() => setAuthType('basic')}
                />
                <span>Basic Auth</span>
              </label>
            </div>

            {authType === 'apiKey' && (
              <div className="auth-input-group">
                <label>API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
                <small>Sent as: Authorization: ApiKey &lt;key&gt;</small>
              </div>
            )}

            {authType === 'basic' && (
              <div className="auth-input-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                />
                <label style={{ marginTop: 12 }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'body' && hasBody && (
          <div className="body-section">
            <label>Request Body (JSON)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`{\n  \"example\": \"value\"\n}`}
              rows={12}
              className="json-editor"
            />
            <small>Paste your JSON payload here</small>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <button
          className="execute-btn"
          onClick={handleExecute}
          disabled={isExecuting}
        >
          {isExecuting ? (
            <>
              <span className="spinner" /> Executing...
            </>
          ) : (
            <>▶ Execute</>
          )}
        </button>
        {isExecuting && (
          <button className="cancel-btn" onClick={handleCancel}>
            ✕ Cancel
          </button>
        )}
        <button className="bookmark-btn" onClick={handleSaveBookmark} disabled={isExecuting}>
          ☆ Save Bookmark
        </button>
      </div>

      {/* Response */}
      {result && (
        <div className={`response-panel ${result.success ? 'success' : 'error'}`}>
          <div className="response-header">
            <div className="response-status">
              {result.success ? '✓' : '✗'} {result.response?.statusCode || 'Error'}
              {result.response?.statusText && ` ${result.response.statusText}`}
              {result.response?.responseTimeMs && (
                <span className="response-time-inline"> ({result.response.responseTimeMs}ms)</span>
              )}
            </div>
            <div className="response-actions">
              {result.success && (
                <button 
                  className="toggle-response-btn"
                  onClick={() => setShowResponse(!showResponse)}
                >
                  {showResponse ? 'Hide Response' : 'Show Response'}
                </button>
              )}
              <button className="clear-result-btn" onClick={handleClearResult}>
                Clear
              </button>
            </div>
          </div>
          {(showResponse || !result.success) && (
            <div className="response-body">
              {result.error ? (
                <div>
                  <div className="error-message">{result.error}</div>
                  {(result.error.includes('CORS') || result.error.includes('Network error')) && (
                    <div className="cors-help">
                      <h4>🔧 Troubleshooting:</h4>
                      <p><strong>1. Check if server is running:</strong></p>
                      <pre>{`curl ${baseUrl}`}</pre>
                      <p><strong>2. Try enabling the CORS proxy:</strong></p>
                      <p>Check the "Use Proxy" checkbox in the toolbar to route requests through the dev server.</p>
                      <p><strong>3. If using Elasticsearch/Kibana, enable CORS:</strong></p>
                      <p>Add to <code>elasticsearch.yml</code>:</p>
                      <pre>{`http.cors.enabled: true
http.cors.allow-origin: "*"
http.cors.allow-headers: "Authorization,Content-Type"`}</pre>
                      <p>Or start with:</p>
                      <pre>{`bin/elasticsearch -E http.cors.enabled=true -E http.cors.allow-origin="*"`}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <JsonHighlighter data={result.response?.body} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OperationDetail;
