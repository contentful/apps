import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentTypeWidgetDefsOld, maybeMigrateParameters } from './migrateParams';
import { ContentFields, KeyValueMap } from 'contentful-management';

describe('maybeMigrateParameters', () => {
  const field1Ref = {
    id: 'title',
    name: 'Title',
    type: 'Symbol',
  } as ContentFields<KeyValueMap>;
  const field2Ref = {
    id: 'image',
    name: 'Image',
    type: 'Link',
  } as ContentFields<KeyValueMap>;
  let installParametersOldShape: Record<string, ContentTypeWidgetDefsOld> = {};

  beforeEach(() => {
    installParametersOldShape = {
      myContentType: {
        ref: {
          sys: {
            id: 'myContentType',
          },
          name: 'My Content Type',
          fields: [field1Ref, field2Ref],
        },
        fields: {
          title: {
            ref: field1Ref,
            control: { fieldId: 'title' },
            widgets: [{ key: 'someWidget' }],
          },
          image: {
            ref: field2Ref,
            widgets: [{ key: 'anotherWidget' }],
          },
        },
        sidebar: null,
      } as unknown as ContentTypeWidgetDefsOld,
    };
  });

  it('removes ref from content type object', () => {
    const migratedParams = maybeMigrateParameters(installParametersOldShape);

    expect(migratedParams['myContentType']).not.toHaveProperty('ref');
  });

  it('adds needed fields to content type object', () => {
    const migratedParams = maybeMigrateParameters(installParametersOldShape);

    expect(migratedParams['myContentType']).toHaveProperty('id');
  });

  it('removes ref from children field properties', () => {
    const migratedParams = maybeMigrateParameters(installParametersOldShape);

    expect(migratedParams['myContentType'].fields['title']).not.toHaveProperty('ref');
    expect(migratedParams['myContentType'].fields['image']).not.toHaveProperty('ref');
  });

  it('adds id field to children field properties', () => {
    const migratedParams = maybeMigrateParameters(installParametersOldShape);

    expect(migratedParams['myContentType'].fields['title']).toHaveProperty('id');
  });
});
