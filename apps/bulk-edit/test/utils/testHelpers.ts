import type { ContentTypeField } from '../../src/locations/Page/types';
import { mockSdk } from '../mocks';

export const createField = (
  type: string,
  id: string = 'test-field',
  name: string = 'Test Field',
  required: boolean = false
): ContentTypeField => ({
  id,
  name,
  required,
  type,
  locale: mockSdk.locales.default,
  uniqueId: `${id}-${mockSdk.locales.default}`,
});
