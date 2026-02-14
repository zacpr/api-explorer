import type { Credential, CredentialType } from '@/models/types';
import { 
  storeCredentialMetadata, 
  getCredentialMetadata, 
  deleteCredentialMetadata,
  listCredentials 
} from '@/db/database';

/**
 * Credential storage interface
 * Implementations:
 * - Browser/Mock: Memory-based (for testing)
 * - Tauri: OS keychain via Rust commands (for production)
 * 
 * Tests: P3-01, P3-02, P3-03, P3-11
 */

const SECRET_STORE = new Map<string, string>();

/**
 * Store a credential securely
 * Stores metadata in SQLite, secret in secure storage
 */
export async function storeCredential(
  name: string,
  type: CredentialType,
  secret: string
): Promise<Credential> {
  // Store metadata in database
  const credential = storeCredentialMetadata({ name, type });
  
  // Store secret in secure storage (OS keychain in production)
  await setSecret(credential.id, secret);
  
  return credential;
}

/**
 * Retrieve credential metadata and secret
 */
export async function getCredentialWithSecret(id: string): Promise<{ credential: Credential; secret: string } | null> {
  const credential = getCredentialMetadata(id);
  if (!credential) return null;
  
  const secret = await getSecret(id);
  if (secret === null) {
    // Secret missing from secure storage
    return null;
  }
  
  return { credential, secret };
}

/**
 * Get credential metadata only (no secret)
 */
export function getCredential(id: string): Credential | undefined {
  return getCredentialMetadata(id);
}

/**
 * Delete credential (metadata + secret)
 */
export async function deleteCredential(id: string): Promise<boolean> {
  await deleteSecret(id);
  return deleteCredentialMetadata(id);
}

/**
 * List all credentials (metadata only)
 */
export function listAllCredentials(): Credential[] {
  return listCredentials();
}

// ============ Secure Storage Implementations ============

/**
 * Set secret in secure storage
 * In production, this calls OS keychain via Tauri
 */
async function setSecret(key: string, value: string): Promise<void> {
  // TODO: Replace with Tauri keychain integration
  // await invoke('store_in_keychain', { key, value });
  
  // Current implementation: in-memory (for testing)
  SECRET_STORE.set(key, value);
}

/**
 * Get secret from secure storage
 * Returns null if not found or keychain is locked
 */
async function getSecret(key: string): Promise<string | null> {
  // TODO: Replace with Tauri keychain integration
  // return await invoke('get_from_keychain', { key });
  
  // Current implementation: in-memory (for testing)
  const value = SECRET_STORE.get(key);
  return value !== undefined ? value : null;
}

/**
 * Delete secret from secure storage
 */
async function deleteSecret(key: string): Promise<void> {
  // TODO: Replace with Tauri keychain integration
  // await invoke('delete_from_keychain', { key });
  
  SECRET_STORE.delete(key);
}

/**
 * Clear all secrets - for testing only
 */
export function __resetSecretStore(): void {
  SECRET_STORE.clear();
}
