import { VercelService } from '../services/vercel-service';
import { VercelPreviewUrlParts } from '../types';

export const constructVercelPreviewUrlParts = async (
  vercelAccessToken: string,
  vercelProjectId: string
): Promise<VercelPreviewUrlParts> => {
  const vercelService = new VercelService(vercelAccessToken);
  const domain = await vercelService.getTargetProductionUrl(vercelProjectId);
  const xVercelProtectionBypass = await vercelService.getProtectionBypass(vercelProjectId);
  return {
    origin: `https://${domain}`,
    xVercelProtectionBypass,
  };
};
