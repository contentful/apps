import {
  ApiPath,
  ListDeploymentSummaryResponse,
  ListProjectsResponse,
  ServerlessFunction,
  AccessToken,
} from '@customTypes/configPage';

interface GetToken {
  ok: boolean;
  data: AccessToken;
}

interface VercelAPIClient {
  checkToken: () => Promise<GetToken>;
  getToken: () => Promise<Response>;
  listProjects: (teamId?: string) => Promise<ListProjectsResponse>;
  listApiPaths: (projectId: string, teamId?: string) => Promise<ApiPath[]>;
}

export default class VercelClient implements VercelAPIClient {
  constructor(public accessToken = '', private baseEndpoint = 'https://api.vercel.com') {}

  private buildHeaders(overrides: Headers = new Headers({})): Headers {
    return new Headers({
      Authorization: `Bearer ${this.accessToken}`,
      ...overrides,
    });
  }

  private buildTeamIdQueryParam(teamId?: string): string {
    return teamId ? `&teamId=${teamId}` : '';
  }

  async checkToken(): Promise<GetToken> {
    const res = await this.getToken();
    const { token } = await res.json();

    if (!res.ok) throw new Error('Token is invalid.');
    if (!token.teamId) throw new Error('Token not scoped to a team.');
    if (Number(token.expiresAt) <= Date.now()) throw new Error('Token has expired.');

    return { ok: res.ok, data: token };
  }

  async getToken(): Promise<Response> {
    const res = await fetch(`${this.baseEndpoint}/v5/user/tokens/current`, {
      headers: this.buildHeaders(),
      method: 'GET',
    });

    return res;
  }

  async listProjects(teamId?: string): Promise<ListProjectsResponse> {
    const res = await fetch(
      `${this.baseEndpoint}/v9/projects?${this.buildTeamIdQueryParam(teamId)}`,
      {
        headers: this.buildHeaders(),
        method: 'GET',
      }
    );

    const data = await res.json();

    return data;
  }

  async listApiPaths(projectId: string, teamId?: string): Promise<ApiPath[]> {
    let deploymentData: ListDeploymentSummaryResponse = { serverlessFunctions: [] };
    try {
      deploymentData = await this.listDeploymentSummary(projectId, teamId);
    } catch (e) {
      console.error(e);
      throw new Error('Failed to fetch API paths.');
    }

    const apiPaths = this.filterServerlessFunctions(deploymentData.serverlessFunctions);
    const formattedApiPaths = this.formatApiPaths(apiPaths);

    return formattedApiPaths;
  }

  async listDeploymentSummary(
    projectId: string,
    teamId?: string,
    deploymentId?: string
  ): Promise<ListDeploymentSummaryResponse> {
    let data: ListDeploymentSummaryResponse = { serverlessFunctions: [] };
    try {
      const latestDeploymentId =
        deploymentId || (await this.getLatestDeploymentId(projectId, teamId));
      const res = await fetch(
        `${
          this.baseEndpoint
        }/v6/deployments/${latestDeploymentId}/files/outputs?file=..%2Fdeploy_metadata.json&${this.buildTeamIdQueryParam(
          teamId
        )}`,
        {
          headers: this.buildHeaders(),
          method: 'GET',
        }
      );

      data = await res.json();
    } catch (e) {
      console.error(e);
      throw new Error('Failed to fetch deployment summary.');
    }

    return data;
  }

  async getLatestDeploymentId(projectId: string, teamId?: string): Promise<string> {
    const res = await fetch(
      `${this.baseEndpoint}/v6/deployments?projectId=${projectId}&${this.buildTeamIdQueryParam(
        teamId
      )}`,
      {
        headers: this.buildHeaders(),
        method: 'GET',
      }
    );

    const data = await res.json();

    // Vercel returns deployments sorted by date in descending order
    return data.deployments[0].uid;
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
