export interface CDAEntry {
  sys: {
    id: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    publishedVersion: number;
    locale: string;
    contentType: {
      sys: {
        type: string;
        linkType: string;
        id: string;
      };
    };
  };
  fields: Record<string, any>;
}

export interface CDAError {
  sys: {
    id: string;
    type: string;
  };
  message: string;
  requestId: string;
  details?: {
    type: string;
    id: string;
    space: string;
  };
}

export interface ContentTypeField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  localized: boolean;
  validations?: any[];
}

export interface ContentType {
  sys: {
    id: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    publishedVersion: number;
    locale: string;
  };
  name: string;
  description: string;
  displayField: string;
  fields: ContentTypeField[];
}

export class CDAService {
  private spaceId: string;
  private environmentId: string;
  private accessToken: string;

  constructor(spaceId: string, environmentId: string, accessToken: string) {
    this.spaceId = spaceId;
    this.environmentId = environmentId;
    this.accessToken = accessToken;
  }

  private getBaseUrl(): string {
    return `https://cdn.contentful.com/spaces/${this.spaceId}/environments/${this.environmentId}`;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: CDAError = await response.json();

      // Provide more specific error messages based on error type
      let errorMessage = `CDA Error: ${error.message}`;

      if (error.sys.id === 'NotFound') {
        if (error.details?.type === 'Environment') {
          errorMessage = `Environment '${error.details.id}' not found in space '${error.details.space}'. Please check your environment ID.`;
        } else if (error.details?.type === 'Entry') {
          errorMessage = `Entry not found. The entry may not exist or may not be published.`;
        } else {
          errorMessage = `Resource not found. Please check the entry ID and ensure it exists and is published.`;
        }
      } else if (error.sys.id === 'AccessDenied') {
        errorMessage = `Access denied. Please check your CDA token permissions.`;
      } else if (error.sys.id === 'InvalidQuery') {
        errorMessage = `Invalid query. Please check your request parameters.`;
      } else if (response.status === 401) {
        errorMessage = `Unauthorized. Please check your CDA token.`;
      } else if (response.status === 403) {
        errorMessage = `Forbidden. You don't have permission to access this resource.`;
      } else if (response.status === 404) {
        errorMessage = `Not found. The requested resource doesn't exist.`;
      }

      throw new Error(`${errorMessage} (Request ID: ${error.requestId})`);
    }

    return response.json();
  }

  async getEntry(entryId: string, locale: string = 'en-US'): Promise<CDAEntry> {
    const endpoint = `/entries/${entryId}?locale=${locale}`;
    return this.makeRequest<CDAEntry>(endpoint);
  }

  async getEntries(
    contentTypeId?: string,
    locale: string = 'en-US',
    limit: number = 100
  ): Promise<{ items: CDAEntry[]; total: number; skip: number; limit: number }> {
    let endpoint = `/entries?locale=${locale}&limit=${limit}`;

    if (contentTypeId) {
      endpoint += `&content_type=${contentTypeId}`;
    }

    return this.makeRequest<{ items: CDAEntry[]; total: number; skip: number; limit: number }>(
      endpoint
    );
  }

  async getContentType(contentTypeId: string): Promise<ContentType> {
    const endpoint = `/content_types/${contentTypeId}`;
    return this.makeRequest<ContentType>(endpoint);
  }

  /**
   * Get entry with content type information for better field type detection
   */
  async getEntryWithContentType(
    entryId: string,
    locale: string = 'en-US'
  ): Promise<{
    entry: CDAEntry;
    contentType: ContentType;
  }> {
    const entry = await this.getEntry(entryId, locale);
    const contentType = await this.getContentType(entry.sys.contentType.sys.id);

    return { entry, contentType };
  }

  /**
   * Check if a field is a rich text field based on content type
   */
  isRichTextField(fieldId: string, contentType: ContentType): boolean {
    const field = contentType.fields.find((f) => f.id === fieldId);
    return field?.type === 'RichText';
  }

  /**
   * Validate the connection to the CDA
   */
  async validateConnection(): Promise<{ valid: boolean; message: string }> {
    try {
      // Try to fetch a simple endpoint to validate the connection
      const endpoint = `/content_types?limit=1`;
      await this.makeRequest<any>(endpoint);
      return { valid: true, message: 'Connection successful' };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}
