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

type RedirectEntryRef = {
  sys?: { type: string; linkType: string; id: string };
  title: string;
  slug: string | undefined;
};

export interface RedirectEntry {
  sys: {
    id: string;
    createdAt: string;
  };
  fields: {
    redirectFromContentTypes: RedirectEntryRef;
    redirectToContentTypes: RedirectEntryRef;
    redirectFrom?: Record<string, string>;
    redirectTo?: Record<string, string>;
    reason: Record<string, string>;
    redirectType: Record<string, string>;
    active: Record<string, boolean>;
  };
}
