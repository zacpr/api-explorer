/**
 * Encrypted credential vault using Web Crypto API
 * 
 * Provides reasonable security for local credential storage:
 * - AES-GCM encryption with PBKDF2 key derivation
 * - Credentials are encrypted at rest in IndexedDB
 * - Master password never stored, only used for key derivation
 */

const DB_NAME = 'api-explorer-vault';
const STORE_NAME = 'credentials';
const DB_VERSION = 1;

// Encryption parameters
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_ITERATIONS = 100000;

interface EncryptedData {
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
}

interface StoredCredential {
  id: string;
  schemaTitle: string;
  name: string;
  baseUrl: string;
  authType: 'none' | 'apiKey' | 'basic';
  // Encrypted fields
  encryptedData: {
    salt: number[];
    iv: number[];
    ciphertext: number[];
  };
  createdAt: number;
}

// In-memory cache of decrypted credentials (lost on page reload)
const credentialCache = new Map<string, DecryptedCredential>();

export interface DecryptedCredential {
  id: string;
  schemaTitle: string;
  name: string;
  baseUrl: string;
  authType: 'none' | 'apiKey' | 'basic';
  apiKey?: string;
  username?: string;
  password?: string;
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt credential data
 */
async function encrypt(
  data: Record<string, string>,
  password: string
): Promise<EncryptedData> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    plaintext
  );
  
  return { salt, iv, ciphertext };
}

/**
 * Decrypt credential data
 */
async function decrypt(
  encryptedData: EncryptedData,
  password: string
): Promise<Record<string, string>> {
  const key = await deriveKey(password, encryptedData.salt);
  
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: encryptedData.iv.buffer as ArrayBuffer },
      key,
      encryptedData.ciphertext
    );
    
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plaintext));
  } catch {
    throw new Error('Invalid master password');
  }
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Store a credential (encrypted)
 */
export async function storeCredential(
  credential: Omit<DecryptedCredential, 'id'>,
  masterPassword: string
): Promise<string> {
  const id = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Prepare sensitive data for encryption
  const sensitiveData: Record<string, string> = {};
  if (credential.apiKey) sensitiveData.apiKey = credential.apiKey;
  if (credential.username) sensitiveData.username = credential.username;
  if (credential.password) sensitiveData.password = credential.password;
  
  // Encrypt sensitive fields
  const encrypted = await encrypt(sensitiveData, masterPassword);
  
  const stored: StoredCredential = {
    id,
    schemaTitle: credential.schemaTitle,
    name: credential.name,
    baseUrl: credential.baseUrl,
    authType: credential.authType,
    encryptedData: {
      salt: Array.from(encrypted.salt),
      iv: Array.from(encrypted.iv),
      ciphertext: Array.from(new Uint8Array(encrypted.ciphertext)),
    },
    createdAt: Date.now(),
  };
  
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(stored);
    
    request.onsuccess = () => {
      // Cache decrypted version
      credentialCache.set(id, { ...credential, id });
      resolve(id);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all credential metadata (without sensitive data)
 */
export async function listCredentials(schemaTitle?: string): Promise<
  Array<{
    id: string;
    schemaTitle: string;
    name: string;
    baseUrl: string;
    authType: 'none' | 'apiKey' | 'basic';
    createdAt: number;
  }>
> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const all = request.result as StoredCredential[];
      const filtered = schemaTitle
        ? all.filter(c => c.schemaTitle === schemaTitle)
        : all;
      
      resolve(
        filtered.map(c => ({
          id: c.id,
          schemaTitle: c.schemaTitle,
          name: c.name,
          baseUrl: c.baseUrl,
          authType: c.authType,
          createdAt: c.createdAt,
        }))
      );
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get and decrypt a credential
 */
export async function getCredential(
  id: string,
  masterPassword: string
): Promise<DecryptedCredential | null> {
  // Check cache first
  const cached = credentialCache.get(id);
  if (cached) return cached;
  
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = async () => {
      const stored = request.result as StoredCredential | undefined;
      if (!stored) return resolve(null);
      
      try {
        const encryptedData: EncryptedData = {
          salt: new Uint8Array(stored.encryptedData.salt),
          iv: new Uint8Array(stored.encryptedData.iv),
          ciphertext: new Uint8Array(stored.encryptedData.ciphertext).buffer,
        };
        
        const decrypted = await decrypt(encryptedData, masterPassword);
        
        const credential: DecryptedCredential = {
          id: stored.id,
          schemaTitle: stored.schemaTitle,
          name: stored.name,
          baseUrl: stored.baseUrl,
          authType: stored.authType,
          apiKey: decrypted.apiKey,
          username: decrypted.username,
          password: decrypted.password,
        };
        
        // Cache for this session
        credentialCache.set(id, credential);
        resolve(credential);
      } catch (error) {
        reject(error);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a credential
 */
export async function deleteCredential(id: string): Promise<void> {
  credentialCache.delete(id);
  
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all credentials
 */
export async function clearAllCredentials(): Promise<void> {
  credentialCache.clear();
  
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if credentials exist for a schema
 */
export async function hasCredentials(schemaTitle: string): Promise<boolean> {
  const list = await listCredentials(schemaTitle);
  return list.length > 0;
}
