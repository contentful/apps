interface FieldItems {
  type: string;
}

export type CompatibleFields = Record<string, Field[]>;

export interface Field {
  id: string;
  name: string;
  type: string;
  items?: FieldItems;
}

export interface ContentType {
  sys: { id: string };
  name: string;
  fields?: Field[];
}

export type Hash = Record<string, any>;

interface Control {
  fieldId: string;
  widgetNamespace: string;
  widgetId: string;
}

export interface EditorInterface {
  sys: { contentType: { sys: { id: string } } };
  controls?: Control[];
}

export interface TypeFormParameters {
  workspaceId: string;
  accessToken: string;
}

export type InstallationParameters = TypeFormParameters | null;

export type SelectedFields = Record<string, string[] | undefined>;
