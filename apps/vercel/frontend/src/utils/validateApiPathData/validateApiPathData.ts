import { ApiPath } from '@customTypes/configPage';

export const validateApiPathData = (apiPathData: ApiPath[]) =>
  Array.isArray(apiPathData) && apiPathData.length > 0;
