import InstanceSelector from './InstanceSelector';
import ThemeSelector from './ThemeSelector';
import type { DecryptedCredential } from '@/services/cryptoVault';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMethod: string | null;
  onMethodChange: (method: string | null) => void;
  onLoadSchema: (schemaName: string) => void;
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
  
  return (
    <div className="toolbar">
      {/* Left section - Search and filters */}
      <div className="toolbar-section">
        <input
          type="text"
          placeholder="Search operations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />

        <select
          value={selectedMethod || 'all'}
          onChange={(e) => onMethodChange(e.target.value === 'all' ? null : e.target.value)}
          className="method-select"
        >
          <option value="all">All Methods</option>
          <option value="get">GET</option>
          <option value="post">POST</option>
          <option value="put">PUT</option>
          <option value="patch">PATCH</option>
          <option value="delete">DELETE</option>
        </select>
      </div>

      {/* Middle section - Schema & Instance */}
      <div className="toolbar-section toolbar-center">
        {/* Schema Selector Dropdown */}
        {hasMultipleSchemas && (
          <div className="schema-selector-wrapper">
            <label>Schema</label>
            <select
              value={currentSchema || ''}
              onChange={(e) => onLoadSchema(e.target.value)}
              disabled={isLoading}
              className="schema-select"
            >
              {availableSchemas.map((schemaName) => (
                <option key={schemaName} value={schemaName}>
                  {schemaName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Instance Selector */}
        {onSelectInstance && currentSchema && (
          <div className="instance-selector-wrapper">
            <label>Instance</label>
            <InstanceSelector
              schemaTitle={currentSchema}
              onSelectInstance={(instance) => {
                onSelectInstance(instance);
                if (instance) {
                  onBaseUrlChange(instance.baseUrl);
                }
              }}
              selectedInstanceId={selectedInstanceId}
            />
          </div>
        )}
      </div>

      {/* Right section - URL, Proxy, Theme */}
      <div className="toolbar-section toolbar-right">
        <div className="url-input-group">
          <label>URL</label>
          <input
            type="text"
            value={baseUrl || ''}
            onChange={(e) => onBaseUrlChange(e.target.value)}
            placeholder="http://localhost:9200"
            className="url-input"
          />
        </div>

        <label className="proxy-toggle" title="Use dev server proxy to bypass CORS">
          <input
            type="checkbox"
            checked={useProxy}
            onChange={(e) => onUseProxyChange?.(e.target.checked)}
          />
          <span>Proxy</span>
        </label>

        <ThemeSelector />
      </div>
    </div>
  );
}

export default Toolbar;
