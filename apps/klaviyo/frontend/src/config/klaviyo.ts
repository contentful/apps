export const KLAVIYO_API_BASE_URL =
  import.meta.env.VITE_KLAVIYO_API_BASE_URL || 'https://a.klaviyo.com/api';

// Use environment variable for API proxy URL with fallback for development
// Make sure the trailing slash is not included to avoid path duplication
export const API_PROXY_URL =
  import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001/api/klaviyo/proxy';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Contentful Klaviyo App';
export const APP_ID = import.meta.env.VITE_APP_ID || 'contentful-klaviyo-app';
export const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

// Deprecated OAuth URLs - no longer used
export const KLAVIYO_AUTH_URL =
  import.meta.env.VITE_KLAVIYO_AUTH_URL || 'https://www.klaviyo.com/oauth/authorize';
export const KLAVIYO_TOKEN_URL =
  import.meta.env.VITE_KLAVIYO_TOKEN_URL || 'https://a.klaviyo.com/oauth/token';

// Default API revision to use
export const API_REVISION = '2023-08-15';

export const MAX_FIELD_MAPPINGS = 25;

export interface KlaviyoConfig {
  publicKey: string;
  privateKey: string;
  companyId?: string;
}

export interface KlaviyoAppConfig {
  publicKey: string;
  privateKey: string;
  selectedLocations?: Record<string, boolean>;
  selectedContentTypes?: Record<string, boolean>;
  fieldMappings?: any[];
  contentTypeMappings?: Record<string, any[]>;
}

export interface FieldMapping {
  id: string;
  contentfulFieldId: string;
  name: string;
  klaviyoBlockName: string;
  type: string;
  fieldType: string;
  contentTypeId?: string;
  value?: any;
}

export interface MappedField {
  contentfulFieldId: string;
  klaviyoBlockName: string;
  fieldType: string;
}

export interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
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

export const DEFAULT_SCOPES = [
  'profile:read',
  'profile:write',
  'list:read',
  'list:write',
  'template:read',
  'template:write',
  'template-render:write',
  'event:read',
  'event:write',
  'campaign:read',
  'campaign:write',
  'metric:read',
  'metric:write',
  'integration:read',
  'integration:write',
];
