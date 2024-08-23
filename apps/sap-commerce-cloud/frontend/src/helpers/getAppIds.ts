/**
 * Get the app ids for the marketplace and air apps based on the environment
 * @returns { sapAppIds: string[]; sapAirAppIds: string[] }
 */
export const getAppIds = (): { sapAppId: string[]; sapAirAppId: string[] } => {
  const isProd = import.meta.env.PROD;
  const appId = import.meta.env.VITE_SAP_APP_ID ?? '';
  const airAppId = import.meta.env.VITE_SAP_AIR_APP_ID ?? '';
  return {
    sapAppId: isProd ? [appId, import.meta.env.VITE_SAP_STAGING_APP_ID ?? ''] : [appId],
    sapAirAppId: isProd
      ? [airAppId, import.meta.env.VITE_SAP_STAGING_AIR_APP_ID ?? '']
      : [airAppId],
  };
};
