import { VercelProject } from '../types';

export class VercelService {
  constructor(readonly accessToken: string, readonly teamId: string) {}

  public async getProject(projectId: string): Promise<VercelProject> {
    const response = await fetch(this.buildProjectUrl(projectId), {
      method: 'GET',
      headers: this.buildRequestHeaders(),
    });
    await this.handleApiError(response);
    const vercelProject = await response.json();
    this.assertVercelProject(vercelProject);
    return vercelProject;
  }

  // cheap and dirty error handling -- could later provide a more structured error response
  // when API errors are encountered
  private async handleApiError(response: Response): Promise<void> {
    if (response.status < 400) return;
    const errorResponse: string = await response.text();
    const { status } = response;
    const msg = `Vercel API error: ${errorResponse} [status: ${status}]`;
    throw new Error(msg);
  }

  private buildRequestHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  private buildProjectUrl(projectId: string) {
    const url = new URL(`https://api.vercel.com/v9/projects/${projectId}`);
    url.searchParams.set('teamId', this.teamId);
    return url.toString();
  }

  private assertVercelProject(value: unknown): asserts value is VercelProject {
    if (!value) throw new Error('value is undefined');
    if (typeof value !== 'object') throw new TypeError('value is not an object');

    const vercelProject = value as VercelProject;
    if (!vercelProject.targets) throw new TypeError('Vercel project is missing targets');
    if (!vercelProject.targets.production)
      throw new TypeError('Vercel project is missing production target');
    if (!vercelProject.targets.production.url)
      throw new TypeError('Vercel project is missing production target URL');
    if (!vercelProject.protectionBypass)
      throw new TypeError('Vercel project is missing protection bypass configuration');
  }
}
