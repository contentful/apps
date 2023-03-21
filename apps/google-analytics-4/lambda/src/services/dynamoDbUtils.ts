import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { config } from '../config';
import { ServiceAccountKeyFile } from '../types';

export async function encryptSharedCredentials(data: object): Promise<string> {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(config.sharedCredentialsSecretKey), iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export async function decryptSharedCredentials(encrypted: string): Promise<ServiceAccountKeyFile> {
  const [ivHex, encryptedHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(config.sharedCredentialsSecretKey),
    iv
  );
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}
