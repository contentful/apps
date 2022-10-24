export interface ConfigurationParameters {
  projectKey?: string;
  clientId?: string;
  clientSecret?: string;
  apiEndpoint?: string;
  authApiEndpoint?: string;
  mcUrl?: string;
  locale?: string;
  skuTypes?: Record<string, Record<string, SkuType | undefined> | undefined>;
}

export type SkuType = 'product' | 'category';
