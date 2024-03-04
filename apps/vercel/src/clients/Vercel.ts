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

  async createDeployment() {
    const res = await fetch('https://api.vercel.com/v13/deployments', {
      headers: this.buildHeaders(),
      body: JSON.stringify({
        name: 'vite-puck-demo',
        // files: [],
        // project: 'prj_BcGPd5kyoggXaTyUCSdBNkt1jixd',
        deploymentId: 'dpl_7exDvp7nUi6ZLyLdk4dvx6dwwEyo', // original deployment id
        gitSource: {
          ref: 'main',
          repoId: '747862663',
          sha: '3cccfadaa1b7ba0af6372698d4cb4a2e4f548a4b',
          type: 'github',
        },
      }),
      method: 'POST',
    });

    return await res.json();
  }
}
