interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMethod: string | null;
  onMethodChange: (method: string | null) => void;
  onLoadSchema: () => void;
  isLoading: boolean;
  baseUrl: string;
  onBaseUrlChange: (url: string) => void;
  useProxy?: boolean;
  onUseProxyChange?: (use: boolean) => void;
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
}: ToolbarProps) {
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
          value={baseUrl}
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

      <div style={{ marginLeft: 'auto' }}>
        <button
          onClick={onLoadSchema}
          disabled={isLoading}
          className="load-schema-btn"
        >
          {isLoading ? 'Loading...' : 'Load ES Schema'}
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
