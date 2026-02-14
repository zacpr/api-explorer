import InstanceSelector from './InstanceSelector';
import ThemeSelector from './ThemeSelector';
import type { DecryptedCredential } from '@/services/cryptoVault';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMethod: string | null;
  onMethodChange: (method: string | null) => void;
  onLoadSchema: (schemaName?: string) => void;
  isLoading: boolean;
  baseUrl: string;
  onBaseUrlChange: (url: string) => void;
  useProxy?: boolean;
  onUseProxyChange?: (use: boolean) => void;
  currentSchema?: string;
  availableSchemas?: string[];
  onSelectInstance?: (instance: DecryptedCredential | null) => void;
  selectedInstanceId?: string | null;
}

function Toolbar({
  searchQuery,
  onSearchChange,
  selectedMethod,
  onMethodChange,
  onLoadSchema,
  isLoading,
  baseUrl,
  onBaseUrlChange,
  useProxy = false,
  onUseProxyChange,
  currentSchema,
  availableSchemas = [],
  onSelectInstance,
  selectedInstanceId,
}: ToolbarProps) {
  const hasMultipleSchemas = availableSchemas.length > 1;
  const otherSchema = currentSchema === 'Kibana' ? 'Elasticsearch' : 'Kibana';
  
  return (
    <div className="toolbar">
      <input
        type="text"
        placeholder="Search operations..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
        style={{ maxWidth: 240 }}
      />

      <select
        value={selectedMethod || 'all'}
        onChange={(e) => onMethodChange(e.target.value === 'all' ? null : e.target.value)}
      >
        <option value="all">All Methods</option>
        <option value="get">GET</option>
        <option value="post">POST</option>
        <option value="put">PUT</option>
        <option value="patch">PATCH</option>
        <option value="delete">DELETE</option>
      </select>

      <div className="url-input-group">
        <label>API URL:</label>
        <input
          type="text"
          value={baseUrl || ''}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          placeholder="http://localhost:9200"
          className="url-input"
        />
        <label className="proxy-toggle" title="Use dev server proxy to bypass CORS">
          <input
            type="checkbox"
            checked={useProxy}
            onChange={(e) => onUseProxyChange?.(e.target.checked)}
          />
          Use Proxy
        </label>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <ThemeSelector />
        
        {currentSchema && (
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Schema: <strong style={{ color: 'var(--text-primary)' }}>{currentSchema}</strong>
          </span>
        )}
        
        {onSelectInstance && currentSchema && (
          <div style={{ width: 280 }}>
            <InstanceSelector
              schemaTitle={currentSchema}
              onSelectInstance={(instance) => {
                onSelectInstance(instance);
                // Auto-update URL when instance is selected
                if (instance) {
                  onBaseUrlChange(instance.baseUrl);
                }
              }}
              selectedInstanceId={selectedInstanceId}
            />
          </div>
        )}

        {hasMultipleSchemas && (
          <button
            onClick={() => onLoadSchema(otherSchema)}
            disabled={isLoading}
            className="load-schema-btn"
            title={`Switch to ${otherSchema} schema`}
          >
            {isLoading ? 'Loading...' : `Load ${otherSchema}`}
          </button>
        )}
      </div>
    </div>
  );
}

export default Toolbar;
