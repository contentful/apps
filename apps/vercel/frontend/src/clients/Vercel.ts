import { CreateDeploymentInput, Deployment, ListProjectsResponse } from '@customTypes/configPage';

interface VercelAPIClient {
  checkToken: () => Promise<boolean>;
  listProjects: () => Promise<ListProjectsResponse>;
  createDeployment: (input: CreateDeploymentInput) => Promise<Deployment>;
  getDeploymentById: (deploymentId: string) => Promise<Deployment>;
}

export default class VercelClient implements VercelAPIClient {
  constructor(public accessToken = '', private baseEndpoint = 'https://api.vercel.com') {}

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

    return res.ok;
  }

  async listProjects(): Promise<ListProjectsResponse> {
    const res = await fetch(`${this.baseEndpoint}/v9/projects`, {
      headers: this.buildHeaders(),
      method: 'GET',
    });

    const data = await res.json();

    return data;
  }

  async createDeployment({ project }: CreateDeploymentInput): Promise<Deployment> {
    const res = await fetch(`${this.baseEndpoint}/v13/deployments`, {
      headers: this.buildHeaders(),
      method: 'POST',
      body: JSON.stringify({
        name: project.name,
        deploymentId: project.targets.production.id,
        target: 'production',
      }),
    });

    const data = await res.json();

    return data;
  }

  async getDeploymentById(deploymentId: string): Promise<Deployment> {
    const res = await fetch(`${this.baseEndpoint}/v13/deployments/${deploymentId}`, {
      headers: this.buildHeaders(),
      method: 'GET',
    });

    const data = await res.json();

    return data;
  }
}
