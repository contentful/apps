declare namespace Express {
  export interface Request {
    contentfulContext: {
      appDefinitionId: string;
      appInstallationId: string;
      spaceId: string;
      environmentId: string;
      calleeId?: string;
      cma: import('contentful-management').PlainClientAPI;
      parameters: unknown;
    };
  }
}
