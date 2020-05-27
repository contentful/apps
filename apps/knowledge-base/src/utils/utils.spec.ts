import {
  getContentTypeSchemaById,
  replaceLocale,
  resetCounters,
} from './utils';
import schema from '../../space-template.json';

describe('getContentTypeSchemaById', () => {
  it('should return the site settings schema', () => {
    const result = getContentTypeSchemaById(
      'kbAppSiteSettings',
      schema.contentTypes
    );

    expect(result.sys.id).toBe('kbAppSiteSettings');
    expect(result.sys.type).toBe('ContentType');
  });

  it('should return null if the schema does not exist', () => {
    const result = getContentTypeSchemaById('wrongId', schema.contentTypes);

    expect(result).toBe(null);
  });
});

describe('replaceLocale', () => {
  it('should replace to a specific locale', () => {
    const result = replaceLocale(schema, 'locale-LOCALE');

    expect(JSON.stringify(result)).toContain('locale-LOCALE');
  });
});

describe('resetCounters', () => {
  it('should reset published version', () => {
    const result = JSON.stringify(resetCounters(schema));
    const publishedVersion = new RegExp('"publishedVersion":[^0]', 'g');

    expect(publishedVersion.test(result)).toEqual(false);
  });

  it('should reset published counter', () => {
    const result = JSON.stringify(resetCounters(schema));
    const publishedCounter = new RegExp('"publishedCounter":[^0]', 'g');

    expect(publishedCounter.test(result)).toEqual(false);
  });

  it('should reset version', () => {
    const result = JSON.stringify(resetCounters(schema));
    const version = new RegExp('"version":[^0]', 'g');

    expect(version.test(result)).toEqual(false);
  });
});
