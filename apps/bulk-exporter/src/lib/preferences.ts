/**
 * Browser localStorage helpers for per-user preferences.
 *
 * All preferences are scoped to the current browser, so when multiple users
 * use the app from their own machines they each get their own settings without
 * any server-side state.
 *
 * Storage keys follow the pattern: `bulk-entry-exporter:v1:<scope>:<...ids>`
 */

import type { ExportFormat } from './exportFormats';

const STORAGE_PREFIX = 'bulk-entry-exporter:v1';

export type FieldPreset = 'essentials' | 'content' | 'references' | 'all' | 'custom';

export interface FieldPreferences {
  selectedFields: string[];
  lastPreset?: FieldPreset;
  updatedAt: string;
}

interface SpacePreferences {
  format?: ExportFormat;
  filenamePattern?: string;
}

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function fieldsKey(spaceId: string, contentTypeId: string): string {
  return `${STORAGE_PREFIX}:fields:${spaceId}:${contentTypeId}`;
}

function spaceKey(spaceId: string): string {
  return `${STORAGE_PREFIX}:space:${spaceId}`;
}

function safeRead<T>(key: string): T | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWrite<T>(key: string, value: T): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // QuotaExceededError or serialization failure
    return false;
  }
}

function safeRemove(key: string): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getFieldPreferences(
  spaceId: string,
  contentTypeId: string
): FieldPreferences | null {
  if (!spaceId || !contentTypeId) return null;
  return safeRead<FieldPreferences>(fieldsKey(spaceId, contentTypeId));
}

export function saveFieldPreferences(
  spaceId: string,
  contentTypeId: string,
  prefs: Omit<FieldPreferences, 'updatedAt'>
): boolean {
  if (!spaceId || !contentTypeId) return false;
  const payload: FieldPreferences = {
    ...prefs,
    updatedAt: new Date().toISOString(),
  };
  return safeWrite(fieldsKey(spaceId, contentTypeId), payload);
}

export function clearFieldPreferences(spaceId: string, contentTypeId: string): void {
  if (!spaceId || !contentTypeId) return;
  safeRemove(fieldsKey(spaceId, contentTypeId));
}

export function getSpacePreferences(spaceId: string): SpacePreferences {
  if (!spaceId) return {};
  return safeRead<SpacePreferences>(spaceKey(spaceId)) ?? {};
}

export function saveSpacePreferences(
  spaceId: string,
  patch: Partial<SpacePreferences>
): boolean {
  if (!spaceId) return false;
  const current = getSpacePreferences(spaceId);
  return safeWrite(spaceKey(spaceId), { ...current, ...patch });
}
