export class InvalidHubspotTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidHubspotTokenError';
  }
}

export class MissingHubspotScopesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingHubspotScopesError';
  }
}
