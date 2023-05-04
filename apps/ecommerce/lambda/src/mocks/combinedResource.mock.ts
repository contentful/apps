import { mockResourceData } from './resourceData.mock';
import { mockResourceLink } from './resourceLink.mock';

export const mockCombinedResource = { ...mockResourceLink, ...mockResourceData };
