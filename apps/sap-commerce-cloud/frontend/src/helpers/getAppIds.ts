/**
 * Get the app ids for the marketplace and air apps based on the environment
 * @returns { sapAppIds: string[]; sapAirAppIds: string[] }
 */
export const getAppIds = (): { sapAppIds: string[]; sapAirAppIds: string[] } => {
  const isProductionEnv = import.meta.env.PROD;
  const ids: string[] = [];
  const appIds = { sapAppIds: ids, sapAirAppIds: ids };

  if (isProductionEnv) {
    // if env is production, staging and prod app ids are valid
    const sapAppIdProd: string = import.meta.env.VITE_SAP_APP_ID ?? '';
    const sapAppIdStaging = import.meta.env.VITE_SAP_STAGING_APP_ID ?? '';
    appIds.sapAppIds.push(sapAppIdProd, sapAppIdStaging);

    const sapAirAppIdProd = import.meta.env.VITE_SAP_AIR_APP_ID ?? '';
    const sapAirAppIdStaging = import.meta.env.VITE_SAP_AIR_STAGING_APP_ID ?? '';
    appIds.sapAirAppIds.push(sapAirAppIdProd, sapAirAppIdStaging);
  } else {
    const sapAirAppIdDev = import.meta.env.VITE_SAP_AIR_APP_ID ?? '';
    appIds.sapAirAppIds.push(sapAirAppIdDev);
    const sapAppIdDev = import.meta.env.VITE_SAP_AIR_STAGING_APP_ID ?? '';
    appIds.sapAppIds.push(sapAppIdDev);
  }

  return appIds;
};
