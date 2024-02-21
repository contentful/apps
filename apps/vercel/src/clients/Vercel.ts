interface Project {
  id: string;
}

interface VercelAPIClient {
  listProjects: () => Promise<Project[]>;
}

export default class VercelClient implements VercelAPIClient {
  baseEndpoint: string;
  accessToken: string;

  constructor(accessToken: string = '') {
    this.baseEndpoint = 'https://api.vercel.com';
    this.accessToken = accessToken;
  }

  private buildHeaders(
    overrides: {
      [key: string]: string;
    } = {}
  ): { [key: string]: string } {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      ...overrides,
    };
  }

  async listProjects(): Promise<any[]> {
    const res = await fetch(`${this.baseEndpoint}/v9/projects`, {
      headers: this.buildHeaders(),
      method: 'GET',
    });

    const body = await res.json();

    return body.projects;
  }
}
