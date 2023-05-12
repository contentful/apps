// lambda types

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export interface JSONObject {
  [key: string]: JSONValue;
}

export type ExternalResourceLinkType = `${Capitalize<string>}:${Capitalize<string>}`;

export interface ExternalResourceLink {
  sys: {
    type: 'ResourceLink';
    linkType: ExternalResourceLinkType;
    urn: string;
  };
  metadata?: {
    [key: string]: JSONValue;
  };
}

export interface ExternalResource {
  name?: string;
  description?: string;
  image?: string;
  status?: string;
  extras?: JSONObject;
}

export interface ErrorResponse {
  status: 'error';
  message: string | unknown;
}
