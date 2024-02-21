interface Project {
  id: string;
  name: string;
}

interface VercelAPIClient {
  checkToken: () => Promise<boolean>;
  listProjects: () => Promise<{ projects: Project[] }>;
}

export default class VercelClient implements VercelAPIClient {
  baseEndpoint: string;
  accessToken: string;

  constructor(accessToken: string = '') {
    this.baseEndpoint = 'https://api.vercel.com';
    this.accessToken = accessToken;
  }

  private buildHeaders(overrides: Headers = new Headers({})): Headers {
    return new Headers({
      Authorization: `Bearer ${this.accessToken}`,
      ...overrides,
    });
  }

  async checkToken(): Promise<boolean> {
    const res = await fetch(`${this.baseEndpoint}/v5/user/tokens`, {
      headers: this.buildHeaders(),
      method: 'GET',
    });

    if (res.ok) {
      return true;
    } else {
      return false;
    }
  }

  async listProjects(): Promise<{ projects: Project[] }> {
    const res = await fetch(`${this.baseEndpoint}/v9/projects`, {
      headers: this.buildHeaders(),
      method: 'GET',
    });

    return await res.json();
  }
}
