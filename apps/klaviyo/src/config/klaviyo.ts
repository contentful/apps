export interface KlaviyoAppConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
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

export interface FieldData {
  id: string;
  name: string;
  type: string;
  value: any;
  isAsset: boolean;
  assetDetails?: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    fileName: string;
    contentType: string;
  }>;
  contentTypeId?: string;
  htmlValue?: string; // <-- Add this for rich text HTML
}
