import { useEffect, useCallback, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { searchOperations, filterByTag, filterByMethod } from '@/services/openapi';
import { loadSchemaFromUrl } from '@/services/schemaLoader';
import Sidebar from '@/components/Sidebar';
import OperationDetail from '@/components/OperationDetail';
import Toolbar from '@/components/Toolbar';

const STORAGE_KEY = 'api-explorer-settings';

interface SavedSettings {
  baseUrl: string;
  useProxy: boolean;
}

function loadSettings(): SavedSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore storage errors
  }
  return { baseUrl: 'http://localhost:9200', useProxy: false };
}

function saveSettings(settings: SavedSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

function App() {
  const [settings, setSettings] = useState<SavedSettings>(loadSettings);
  const baseUrl = settings.baseUrl;
  const useProxy = settings.useProxy;
  
  const updateSettings = (updates: Partial<SavedSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  };
  
  const setBaseUrl = (url: string) => updateSettings({ baseUrl: url });
  const setUseProxy = (use: boolean) => updateSettings({ useProxy: use });
  
  const {
    schema,
    operations,
    filteredOperations,
    selectedOperation,
    searchQuery,
    selectedTag,
    selectedMethod,
    isLoading,
    error,
    setSchema,
    setOperations,
    setFilteredOperations,
    selectOperation,
    setSearchQuery,
    setSelectedTag: _setSelectedTag,
    setSelectedMethod,
    setIsLoading,
    setError,
  } = useAppStore();

  // Load schema on mount (using Kibana as default)
  useEffect(() => {
    loadDefaultSchema();
  }, []);

  // Filter operations when criteria change
  useEffect(() => {
    let result = operations;
    
    if (selectedTag) {
      result = filterByTag(result, selectedTag);
    }
    
    if (selectedMethod) {
      result = filterByMethod(result, selectedMethod as any);
    }
    
    result = searchOperations(result, searchQuery);
    
    setFilteredOperations(result);
  }, [operations, searchQuery, selectedTag, selectedMethod, setFilteredOperations]);

  const loadDefaultSchema = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try Kibana schema first
      const result = await loadSchemaFromUrl('/schemas/kibana-openapi-source.yaml');
      setSchema(result);
      setOperations(result.operations);
      setFilteredOperations(result.operations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSchema = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadSchemaFromUrl('/schemas/elasticsearch-openapi-source.yaml');
      setSchema(result);
      setOperations(result.operations);
      setFilteredOperations(result.operations);
      selectOperation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setIsLoading(false);
    }
  }, [setSchema, setOperations, setFilteredOperations, selectOperation, setIsLoading, setError]);

  return (
    <div className="app">
      <Sidebar
        tags={schema?.tags || []}
        operations={filteredOperations}
        selectedOperation={selectedOperation}
        selectedTag={selectedTag}
        onSelectOperation={selectOperation}
        schemaName={schema?.title}
        operationCount={operations.length}
      />
      
      <div className="main-content">
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
          onLoadSchema={handleLoadSchema}
          isLoading={isLoading}
          baseUrl={baseUrl}
          onBaseUrlChange={setBaseUrl}
          useProxy={useProxy}
          onUseProxyChange={setUseProxy}
        />
        
        <div className="content-area">
          {error ? (
            <div className="empty-state">
              <div>
                <p>Error: {error}</p>
                <button onClick={loadDefaultSchema} className="load-schema-btn" style={{ marginTop: 16 }}>
                  Retry
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="empty-state">Loading schema...</div>
          ) : selectedOperation ? (
            <OperationDetail operation={selectedOperation} baseUrl={baseUrl} useProxy={useProxy} />
          ) : (
            <div className="empty-state">
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: 8 }}>API Explorer</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {schema?.title} v{schema?.version}
                </p>
                <p style={{ marginTop: 16, fontSize: 14 }}>
                  {operations.length.toLocaleString()} operations loaded
                </p>
                <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Select an operation from the sidebar to begin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
