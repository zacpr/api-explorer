import { useState, useEffect, useCallback } from 'react';
import { 
  listCredentials, 
  getCredential, 
  storeCredential, 
  deleteCredential,
  type DecryptedCredential 
} from '@/services/cryptoVault';

interface InstanceSelectorProps {
  schemaTitle: string;
  onSelectInstance: (instance: DecryptedCredential | null) => void;
  selectedInstanceId?: string | null;
}

interface InstanceMeta {
  id: string;
  schemaTitle: string;
  name: string;
  baseUrl: string;
  authType: 'none' | 'apiKey' | 'basic';
  createdAt: number;
}

function InstanceSelector({ 
  schemaTitle, 
  onSelectInstance,
  selectedInstanceId 
}: InstanceSelectorProps) {
  const [instances, setInstances] = useState<InstanceMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingInstanceId, setPendingInstanceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for new instance
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: 'http://localhost:9200',
    authType: 'none' as 'none' | 'apiKey' | 'basic',
    apiKey: '',
    username: '',
    password: '',
  });

  const loadInstances = useCallback(async () => {
    try {
      const list = await listCredentials(schemaTitle);
      setInstances(list);
    } catch (err) {
      console.error('Failed to load instances:', err);
    }
  }, [schemaTitle]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  const handleSelect = async (instanceId: string) => {
    if (instanceId === 'custom') {
      onSelectInstance(null);
      return;
    }

    setPendingInstanceId(instanceId);
    setShowPasswordPrompt(true);
    setError(null);
  };

  const handleUnlock = async () => {
    if (!pendingInstanceId || !masterPassword) return;

    setIsLoading(true);
    setError(null);

    try {
      const credential = await getCredential(pendingInstanceId, masterPassword);
      if (credential) {
        onSelectInstance(credential);
        setShowPasswordPrompt(false);
        setMasterPassword('');
        setPendingInstanceId(null);
      } else {
        setError('Credential not found');
      }
    } catch {
      setError('Invalid master password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInstance = async () => {
    if (!formData.name || !formData.baseUrl) {
      setError('Name and URL are required');
      return;
    }

    if (!masterPassword) {
      setError('Master password is required to encrypt credentials');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const credential: Omit<DecryptedCredential, 'id'> = {
        schemaTitle,
        name: formData.name,
        baseUrl: formData.baseUrl,
        authType: formData.authType,
        apiKey: formData.apiKey,
        username: formData.username,
        password: formData.password,
      };

      const id = await storeCredential(credential, masterPassword);
      await loadInstances();
      
      // Select the newly created instance
      const newCredential = await getCredential(id, masterPassword);
      if (newCredential) {
        onSelectInstance(newCredential);
      }

      // Reset form
      setFormData({
        name: '',
        baseUrl: 'http://localhost:9200',
        authType: 'none',
        apiKey: '',
        username: '',
        password: '',
      });
      setMasterPassword('');
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save instance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this instance?')) return;
    
    try {
      await deleteCredential(id);
      await loadInstances();
      if (selectedInstanceId === id) {
        onSelectInstance(null);
      }
    } catch (err) {
      setError('Failed to delete instance');
    }
  };

  return (
    <div className="instance-selector">
      <div className="instance-select-row">
        <select
          value={selectedInstanceId || 'custom'}
          onChange={(e) => handleSelect(e.target.value)}
          className="instance-dropdown"
        >
          <option value="custom">Custom (no saved instance)</option>
          {instances.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name} ({inst.baseUrl})
            </option>
          ))}
        </select>
        <button 
          className="add-instance-btn"
          onClick={() => {
            setShowAddModal(true);
            setError(null);
          }}
          title="Add new API instance"
        >
          +
        </button>
      </div>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="modal-overlay" onClick={() => setShowPasswordPrompt(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Unlock Instance</h3>
            <p>Enter your master password to decrypt credentials</p>
            
            <input
              type="password"
              placeholder="Master password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              autoFocus
            />
            
            {error && <div className="error-text">{error}</div>}
            
            <div className="modal-actions">
              <button onClick={handleUnlock} disabled={isLoading}>
                {isLoading ? 'Unlocking...' : 'Unlock'}
              </button>
              <button onClick={() => setShowPasswordPrompt(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Instance Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Add API Instance</h3>
            
            <div className="form-group">
              <label>Instance Name *</label>
              <input
                type="text"
                placeholder="e.g., Production Elasticsearch"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Base URL *</label>
              <input
                type="text"
                placeholder="http://localhost:9200"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Authentication</label>
              <select
                value={formData.authType}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  authType: e.target.value as 'none' | 'apiKey' | 'basic' 
                })}
              >
                <option value="none">No Auth</option>
                <option value="apiKey">API Key</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            {formData.authType === 'apiKey' && (
              <div className="form-group">
                <label>API Key</label>
                <input
                  type="password"
                  placeholder="Enter API key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
              </div>
            )}

            {formData.authType === 'basic' && (
              <>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Master Password *</label>
              <input
                type="password"
                placeholder="Create a master password to encrypt credentials"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
              />
              <small>This password will be required to unlock this instance</small>
            </div>

            {error && <div className="error-text">{error}</div>}

            <div className="modal-actions">
              <button onClick={handleSaveInstance} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Instance'}
              </button>
              <button onClick={() => {
                setShowAddModal(false);
                setMasterPassword('');
                setError(null);
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instance list with delete buttons */}
      {instances.length > 0 && (
        <div className="saved-instances">
          <small>Saved instances: {instances.length}</small>
          {selectedInstanceId && instances.find(i => i.id === selectedInstanceId) && (
            <button 
              className="delete-btn"
              onClick={() => handleDelete(selectedInstanceId)}
              title="Delete selected instance"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default InstanceSelector;
