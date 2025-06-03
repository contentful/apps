export interface ContentType {
  sys: { id: string };
  name: string;
  fields?: ContentTypeField[];
}

export interface ContentTypeField {
  id: string;
  name: string;
}

export interface Entry {
  sys: {
    id: string;
    contentType: { sys: { id: string } };
    publishedVersion?: number;
    version: number;
  };
  fields: { [key: string]: { [locale: string]: string } };
}

export interface Status {
  label: string;
  color: 'primary' | 'positive' | 'negative' | 'warning';
}
