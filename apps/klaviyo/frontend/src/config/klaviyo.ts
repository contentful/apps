export const KLAVIYO_API_BASE_URL =
  import.meta.env.VITE_KLAVIYO_API_BASE_URL || 'https://a.klaviyo.com/api';

// Use environment variable for API proxy URL with fallback for development
// Make sure the trailing slash is not included to avoid path duplication
export const API_PROXY_URL = (
  import.meta.env.VITE_KLAVIYO_PROXY_URL ||
  (import.meta.env.MODE === 'production'
    ? '/api/klaviyo/proxy'
    : 'http://localhost:3001/api/klaviyo/proxy')
).replace(/\/$/, '');

export const KLAVIYO_AUTH_URL =
  import.meta.env.VITE_KLAVIYO_AUTH_URL || 'https://www.klaviyo.com/oauth/authorize';
export const KLAVIYO_TOKEN_URL =
  import.meta.env.VITE_KLAVIYO_TOKEN_URL || 'https://a.klaviyo.com/oauth/token';
export const KLAVIYO_REVOKE_URL =
  import.meta.env.VITE_KLAVIYO_REVOKE_URL || 'https://a.klaviyo.com/oauth/revoke';

export const MAX_FIELD_MAPPINGS = 25;

export interface KlaviyoConfig {
  apiKey: string;
  companyId?: string;
}

export interface KlaviyoOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
}

export interface KlaviyoAppConfig extends KlaviyoOAuthConfig {
  selectedLocations?: Record<string, boolean>;
  selectedContentTypes?: Record<string, boolean>;
}

export interface MappedField {
  fieldId: string;
  klaviyoProperty: string;
  mappingType: 'profile' | 'event' | 'custom';
  lastMappedAt?: number; // timestamp
}

export interface FieldMapping {
  contentTypeId: string;
  fields: MappedField[];
  fieldType: 'text' | 'image' | 'entry' | 'reference-array';
  contentfulFieldId: string;
  klaviyoBlockName: string;
  name: string;
  type: string;
  severity: string;
  value: any;
  isAssetField?: boolean;
}

export interface EntryConfig {
  entryId: string;
  contentTypeId: string;
  mappings: FieldMapping[];
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

export const DEFAULT_SCOPES = [
  'accounts:read',
  'metrics:read',
  'profiles:read',
  'profiles:write',
  'lists:read',
  'lists:write',
  'templates:read',
  'templates:write',
];
