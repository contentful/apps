import { describe, expect, it } from 'vitest';
import { getFieldIdForContentType } from '../../src/utils/fieldUtils';
import { AppInstallationParameters } from '../../src/utils/types';
describe('fieldUtils', () => {
  describe('getFieldIdForContentType', () => {
    const baseConfig: AppInstallationParameters = {
      sourceFieldId: 'defaultField',
      separator: '-',
      overrides: [],
    };

    it('should return sourceFieldId when no overrides exist or contentTypeId does not match', () => {
      const contentTypeId = 'test-content-type';
      const config1: AppInstallationParameters = {
        ...baseConfig,
        sourceFieldId: 'title',
        overrides: [],
      };
      const config2: AppInstallationParameters = {
        ...baseConfig,
        sourceFieldId: 'title',
        overrides: [
          {
            id: 'override-1',
            contentTypeId: 'other-type',
            fieldId: 'name',
          },
        ],
      };

      expect(getFieldIdForContentType(contentTypeId, config1)).toBe('title');
      expect(getFieldIdForContentType('non-matching-type', config2)).toBe('title');
    });

    it('should return override fieldId when multiple overrides exist and one matches', () => {
      const contentTypeId = 'type-b';
      const config: AppInstallationParameters = {
        ...baseConfig,
        sourceFieldId: 'title',
        overrides: [
          {
            id: 'override-1',
            contentTypeId: 'type-a',
            fieldId: 'field-a',
          },
          {
            id: 'override-2',
            contentTypeId: 'type-b',
            fieldId: 'field-b',
          },
          {
            id: 'override-3',
            contentTypeId: 'type-c',
            fieldId: 'field-c',
          },
        ],
      };

      const result = getFieldIdForContentType(contentTypeId, config);
      expect(result).toBe('field-b');
    });
  });
});
