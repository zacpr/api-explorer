import { useEffect, useCallback, useState } from 'react';
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
    }
  };

  const loadSchemaEntry = async (entry: SchemaRegistryEntry) => {
    setCurrentSchemaEntry(entry);
    setSelectedInstance(null);
    setSelectedInstanceId(null);
    const result = await loadSchemaFromRegistry(entry);
    setSchema(result);
    setOperations(result.operations);
    setFilteredOperations(result.operations);
  };

  const handleLoadSchema = useCallback(async (schemaTitle: string) => {
    setIsLoading(true);
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
      setError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setIsLoading(false);
    }
  }, [setSchema, setOperations, setFilteredOperations, selectOperation, setIsLoading, setError]);

  // Toggle between Kibana and Elasticsearch for now
  const handleToggleSchema = useCallback(async () => {
    const nextSchema = currentSchemaEntry?.title === 'Kibana' ? 'Elasticsearch' : 'Kibana';
    await handleLoadSchema(nextSchema);
  }, [currentSchemaEntry, handleLoadSchema]);

  const handleSelectInstance = useCallback((instance: DecryptedCredential | null) => {
    setSelectedInstance(instance);
    setSelectedInstanceId(instance?.id || null);
    
    // If instance has auth, we need to pass it to OperationDetail
    // This will be handled via the selectedInstance prop
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
          onLoadSchema={handleToggleSchema}
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
                <p>Error: {error}</p>
                <button onClick={loadRegistryAndDefaultSchema} className="load-schema-btn" style={{ marginTop: 16 }}>
                  Retry
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="empty-state">
              <div>
                <p>Loading schema...</p>
                {currentSchemaEntry && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                    {currentSchemaEntry.title}
                  </p>
                )}
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
