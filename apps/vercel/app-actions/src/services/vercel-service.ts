export class VercelService {
  constructor(readonly accessToken: string) {}

  // https://team-integrations-vercel-playground-master.vercel.app/api/enable-draft?path=/blogs/the-journey-has-begun&x-vercel-protection-bypass=ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7
  public async getTargetProductionUrl(projectId: string): Promise<string> {
    // path in project is targets.production.url
    return 'team-integrations-vercel-playground-master.vercel.app';
  }

  public async getProtectionBypass(projectId: string): Promise<string> {
    // path in project is protectionBypass.keys[0]
    return 'ukkdTdqAgnG5DQHwFkIeQ22N1nUDWeU7';
  }
}
