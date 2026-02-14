import { describe, it, expect, beforeEach } from 'vitest';
import {
  storeCredential,
  getCredential,
  getCredentialWithSecret,
  deleteCredential,
  listAllCredentials,
  __resetSecretStore,
} from '@/services/credentials';
import { __resetDatabase } from '@/db/database';

describe('Phase 3: Credential Management', () => {
  beforeEach(() => {
    __resetDatabase();
    __resetSecretStore();
  });

  describe('P3-01: Store API key in secure storage', () => {
    it('should store credential metadata in database', async () => {
      const credential = await storeCredential('My API Key', 'api_key', 'secret123');
      
      expect(credential.id).toBeDefined();
      expect(credential.name).toBe('My API Key');
      expect(credential.type).toBe('api_key');
    });

    it('should NOT store secret in metadata', async () => {
      const credential = await storeCredential('My API Key', 'api_key', 'secret123');
      
      // Metadata should not contain secret
      const metadata = getCredential(credential.id);
      expect(metadata).toBeDefined();
      expect((metadata as any).secret).toBeUndefined();
      expect((metadata as any).value).toBeUndefined();
    });

    it('should store secret separately in secure store', async () => {
      const credential = await storeCredential('My API Key', 'api_key', 'secret123');
      
      // Secret should be retrievable
      const withSecret = await getCredentialWithSecret(credential.id);
      expect(withSecret).toBeDefined();
      expect(withSecret!.secret).toBe('secret123');
    });
  });

  describe('P3-02: Retrieve API key from secure storage', () => {
    it('should retrieve credential with secret', async () => {
      await storeCredential('Test Key', 'bearer', 'bearer-token-xyz');
      
      const credentials = listAllCredentials();
      expect(credentials).toHaveLength(1);
      
      const withSecret = await getCredentialWithSecret(credentials[0].id);
      expect(withSecret!.secret).toBe('bearer-token-xyz');
    });

    it('should retrieve different secrets for different credentials', async () => {
      const cred1 = await storeCredential('Key 1', 'api_key', 'secret-1');
      const cred2 = await storeCredential('Key 2', 'api_key', 'secret-2');
      
      const withSecret1 = await getCredentialWithSecret(cred1.id);
      const withSecret2 = await getCredentialWithSecret(cred2.id);
      
      expect(withSecret1!.secret).toBe('secret-1');
      expect(withSecret2!.secret).toBe('secret-2');
    });
  });

  describe('P3-03: Credential retrieval fails gracefully when locked', () => {
    it('should return null when secret is missing', async () => {
      // Store credential normally
      const credential = await storeCredential('Test Key', 'api_key', 'my-secret');
      
      // Delete just the secret (simulates keychain being cleared)
      __resetSecretStore();
      
      // Should return null, not throw
      const withSecret = await getCredentialWithSecret(credential.id);
      expect(withSecret).toBeNull();
    });

    it('should still return metadata when secret is missing', async () => {
      const credential = await storeCredential('Test Key', 'api_key', 'my-secret');
      __resetSecretStore();
      
      // Metadata should still be available
      const metadata = getCredential(credential.id);
      expect(metadata).toBeDefined();
      expect(metadata!.name).toBe('Test Key');
    });
  });

  describe('Credential CRUD', () => {
    it('should delete credential and secret', async () => {
      const credential = await storeCredential('To Delete', 'api_key', 'secret');
      
      await deleteCredential(credential.id);
      
      expect(getCredential(credential.id)).toBeUndefined();
      expect(await getCredentialWithSecret(credential.id)).toBeNull();
    });

    it('should list all credentials', async () => {
      await storeCredential('Key 1', 'api_key', 'secret1');
      await storeCredential('Key 2', 'bearer', 'secret2');
      await storeCredential('Key 3', 'basic', 'secret3');
      
      const credentials = listAllCredentials();
      expect(credentials).toHaveLength(3);
      
      // Verify types
      expect(credentials.map(c => c.type)).toContain('api_key');
      expect(credentials.map(c => c.type)).toContain('bearer');
      expect(credentials.map(c => c.type)).toContain('basic');
    });

    it('should support all credential types', async () => {
      const apiKey = await storeCredential('API Key', 'api_key', 'key123');
      const bearer = await storeCredential('Bearer', 'bearer', 'token123');
      const basic = await storeCredential('Basic', 'basic', 'user:pass');
      const oauth2 = await storeCredential('OAuth2', 'oauth2', 'oauth-secret');
      
      expect(apiKey.type).toBe('api_key');
      expect(bearer.type).toBe('bearer');
      expect(basic.type).toBe('basic');
      expect(oauth2.type).toBe('oauth2');
    });
  });
});
