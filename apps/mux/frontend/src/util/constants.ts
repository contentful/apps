export const APP_ORGANIZATION_ID = '5EJGHo8tYJcjnEhYWDxivp';
const APP_DEFINITION_ID = '5l4WmuXdhJGcADHfCm1v4k';

export const isMarketplaceVersion = ({ appId }: { appId: string }) => {
  return appId === APP_DEFINITION_ID;
};
