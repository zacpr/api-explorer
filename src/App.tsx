import { useEffect, useCallback, useState, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { searchOperations, filterByTag, filterByMethod } from '@/services/openapi';
import { 
  loadSchemaRegistry, 
  loadSchemaFromRegistry, 
  getAvailableSchemas,
  getDefaultSchema,
  findSchemaByTitle,
  type SchemaRegistryEntry 
} from '@/services/schemaRegistry';
import type { DecryptedCredential } from '@/services/cryptoVault';
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
  
  const [registryEntries, setRegistryEntries] = useState<SchemaRegistryEntry[]>([]);
  const [currentSchemaEntry, setCurrentSchemaEntry] = useState<SchemaRegistryEntry | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<DecryptedCredential | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load registry and default schema on mount
  useEffect(() => {
    loadRegistryAndDefaultSchema();
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

  const loadRegistryAndDefaultSchema = async () => {
    setIsLoading(true);
    setLoadingProgress('Loading schema registry...');
    setError(null);
    try {
      const registry = await loadSchemaRegistry();
      const availableSchemas = getAvailableSchemas(registry);
      setRegistryEntries(availableSchemas);
      
      // Load default schema (first available)
      const defaultEntry = getDefaultSchema(registry);
      if (defaultEntry) {
        await loadSchemaEntry(defaultEntry);
      } else {
        setError('No schemas available in registry');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schema registry');
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  const loadSchemaEntry = async (entry: SchemaRegistryEntry) => {
    // Cancel any previous loading
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setCurrentSchemaEntry(entry);
    setSelectedInstance(null);
    setSelectedInstanceId(null);
    setLoadingProgress(`Loading ${entry.title} schema...`);
    
    try {
      const result = await loadSchemaFromRegistry(entry, abortControllerRef.current.signal);
      
      // Check if aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }
      
      setSchema(result);
      setOperations(result.operations);
      setFilteredOperations(result.operations);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      throw err;
    }
  };

  const handleLoadSchema = useCallback(async (schemaTitle: string) => {
    // Prevent loading if already loading this schema
    if (isLoading && currentSchemaEntry?.title === schemaTitle) {
      return;
    }
    
    setIsLoading(true);
    setLoadingProgress(`Loading ${schemaTitle}...`);
    setError(null);
    
    try {
      const registry = await loadSchemaRegistry();
      const entry = findSchemaByTitle(registry, schemaTitle);
      
      if (!entry) {
        throw new Error(`Schema '${schemaTitle}' not found in registry`);
      }
      
      await loadSchemaEntry(entry);
      selectOperation(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  }, [isLoading, currentSchemaEntry, setSchema, setOperations, setFilteredOperations, selectOperation, setIsLoading, setError]);

  const handleSelectInstance = useCallback((instance: DecryptedCredential | null) => {
    setSelectedInstance(instance);
    setSelectedInstanceId(instance?.id || null);
  }, []);

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
          currentSchema={currentSchemaEntry?.title}
          availableSchemas={registryEntries.map(e => e.title)}
          onSelectInstance={handleSelectInstance}
          selectedInstanceId={selectedInstanceId}
        />
        
        <div className="content-area">
          {error ? (
            <div className="empty-state">
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <h3 style={{ marginBottom: 8 }}>Error Loading Schema</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
                <button onClick={loadRegistryAndDefaultSchema} className="execute-btn">
                  Try Again
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="empty-state">
              <div style={{ textAlign: 'center' }}>
                <div className="spinner-large" style={{ margin: '0 auto 24px' }} />
                <h3 style={{ marginBottom: 8 }}>Loading Schema</h3>
                {currentSchemaEntry && (
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    {currentSchemaEntry.title}
                  </p>
                )}
                {loadingProgress && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                    {loadingProgress}
                  </p>
                )}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, maxWidth: 400 }}>
                  Large schemas like Elasticsearch may take a moment to parse...
                </p>
              </div>
            </div>
          ) : selectedOperation ? (
            <OperationDetail 
              operation={selectedOperation} 
              baseUrl={baseUrl} 
              useProxy={useProxy}
              preAuthenticatedInstance={selectedInstance}
            />
          ) : (
            <div className="empty-state">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔌</div>
                <h3 style={{ marginBottom: 8 }}>API Explorer</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {schema?.title} v{schema?.version}
                </p>
                <p style={{ marginTop: 16, fontSize: 14 }}>
                  {operations.length.toLocaleString()} operations loaded
                </p>
                <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
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
