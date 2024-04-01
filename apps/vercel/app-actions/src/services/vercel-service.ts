import { VercelProject } from '../types';

export class VercelService {
  readonly projectCache: Record<string, VercelProject> = {};

  constructor(readonly accessToken: string) {}

  // https://team-integrations-vercel-playground-master.vercel.app/api/enable-draft?path=/blogs/the-journey-has-begun&x-vercel-protection-bypass=ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7
  public async getTargetProductionUrl(projectId: string): Promise<string> {
    // path in project is targets.production.url
    this.getVercelProject(projectId);
    return 'team-integrations-vercel-playground-master.vercel.app';
  }

  public async getProtectionBypass(projectId: string): Promise<string> {
    // path in project is protectionBypass.keys[0]
    return 'ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7';
  }

  private async getVercelProject(projectId: string): Promise<VercelProject> {
    return this.fetchVercelProject(projectId);
  }

  private async fetchVercelProject(projectId: string): Promise<VercelProject> {
    console.log('go');
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
  }
}
