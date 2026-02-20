export interface ContentType {
  id: string;
  name: string;
}

export interface AppInstallationParameters {
  enableVanityUrl: boolean;
  redirectFromContentTypes: ContentType[];
  redirectToContentTypes: ContentType[];
}
