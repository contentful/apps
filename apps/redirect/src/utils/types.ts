import { ReactNode } from 'react';

export interface ContentType {
  id: string;
  name: string;
}

export interface AppInstallationParameters {
  enableVanityUrl: boolean;
  redirectFromContentTypes: ContentType[];
  redirectToContentTypes: ContentType[];
}

export type TableColumn<T> = {
  id: string;
  label: string | ReactNode;
  style?: React.CSSProperties;
  render: (item: T) => ReactNode;
};

export type RedirectEntry = {
  sys: {
    id: string;
  };
  fields: {
    id: { value: string };
    title: { value: string };
    slug: { value: string };
  };
};

export type Redirect = {
  id: string;
  title: string;
  source: RedirectEntry;
  destination: RedirectEntry;
  reason: string;
  type: string;
  status: string;
  createdAt: string;
};
