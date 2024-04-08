import {
  ApiPath,
  CreateDeploymentInput,
  Deployment,
  ListDeploymentSummaryResponse,
  ListProjectsResponse,
  ServerlessFunction,
} from '@customTypes/configPage';

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

  async listDeploymentSummaries(
    projectId: string,
    deploymentId?: string
  ): Promise<ListDeploymentSummaryResponse> {
    const latestDeploymentId = deploymentId || (await this.getLatestDeploymentId(projectId));
    const res = await fetch(
      `${this.baseEndpoint}/v6/deployments/${latestDeploymentId}/files/outputs?file=..%2Fdeploy_metadata.json`,
      {
        headers: this.buildHeaders(),
        method: 'GET',
      }
    );

    const data = await res.json();

    return data;
  }

  async listApiPaths(projectId: string): Promise<ApiPath[]> {
    const data = await this.listDeploymentSummaries(projectId);

    const apiPaths = this.filterServerlessFunctions(data.serverlessFunctions);
    const formattedApiPaths = this.formatApiPaths(apiPaths);

    return formattedApiPaths;
  }

  async getLatestDeploymentId(projectId: string): Promise<string> {
    const res = await fetch(`${this.baseEndpoint}/v6/deployments?projectId=${projectId}`, {
      headers: this.buildHeaders(),
      method: 'GET',
    });

    const data = await res.json();

    return data.deployments[0].uid;
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

  private filterServerlessFunctions(data: ServerlessFunction[]) {
    return data.filter(
      (file: ServerlessFunction) => file.type === 'Page' && file.path.includes('api')
    );
  }

  private formatApiPaths(data: ServerlessFunction[]): ApiPath[] {
    return data.map((file: ServerlessFunction) => {
      const filePath = file.path;
      return {
        name: filePath,
        id: filePath,
      };
    });
  }
}
