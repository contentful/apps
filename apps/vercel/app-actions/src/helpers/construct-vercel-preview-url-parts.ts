import { VercelPreviewUrlParts, VercelProject } from '../types';

export const constructVercelPreviewUrlParts = (
  vercelProject: VercelProject
): VercelPreviewUrlParts => {
  const domain = vercelProject.targets.production.url;
  const xVercelProtectionBypass = Object.keys(vercelProject.protectionBypass)[0];
  return {
    origin: `https://${domain}`,
    xVercelProtectionBypass,
  };
};
