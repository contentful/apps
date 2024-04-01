import { VercelProject } from '../types';

export class VercelService {
  constructor(readonly accessToken: string) {}

  public async getProject(projectId: string): Promise<VercelProject> {
    const response = await fetch(this.buildProjectUrl(projectId), {
      method: 'POST',
      headers: this.buildRequestHeaders(),
    });
    const vercelProject = await response.json();
    this.assertVercelProject(vercelProject);
    return vercelProject;
  }

  private buildRequestHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  private buildProjectUrl(projectId: string) {
    return `https://api.vercel.com/v10/projects/${projectId}`;
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
