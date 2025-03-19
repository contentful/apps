import { describe, expect, it } from 'vitest';
import { BasicField } from '../../src/fields/BasicField';
import { Entry } from '../../src/fields/Entry';
import { removeIndentation } from '../../src/utils';

describe('Entry', () => {
  const field = new BasicField('title', 'blogPost', false);
  const localizedField = new BasicField('title', 'blogPost', true);
  const entry = new Entry('anId', 'aCustomContentType', [field], 'anSpaceId', 'apiToken');
  const entryLocalized = new Entry(
    'anId',
    'aCustomContentType',
    [localizedField],
    'anSpaceId',
    'apiToken'
  );
  const locales = ['en-US', 'it', 'es-AR'];

  it('Generates content call with no fields', () => {
    const entry = new Entry('anId', 'aCustomContentType', [], 'anSpaceId', 'apiToken');
    const result = entry.generateConnectedContentCall([]);
    const expected = removeIndentation(`{% capture body %}
      {"query":"{aCustomContentType(id:\\"anId\\"){}}"}
      {% endcapture %}
      
      {% connected_content
      https://graphql.contentful.com/content/v1/spaces/anSpaceId
      :method post
      :headers {"Authorization": "Bearer apiToken"}
      :body {{body}}
      :content_type application/json
      :save response
  %}`);

    expect(removeIndentation(result)).toContain(expected);
  });

  it('Generates content call with a body with localization', () => {
    const result = entry.generateConnectedContentCall([]);
    const expectedQueryBody = `{"query":"{aCustomContentType(id:\\"anId\\"){title}}"}`;

    expect(result).toContain(expectedQueryBody);
  });

  it('Generates content call with a body with localization', () => {
    const result = entryLocalized.generateConnectedContentCall(locales);

    const expected = `{"query":"{enUS: aCustomContentType(id:\\"anId\\", locale:\\"en-US\\"){title},it: aCustomContentType(id:\\"anId\\", locale:\\"it\\"){title},esAR: aCustomContentType(id:\\"anId\\", locale:\\"es-AR\\"){title}}"}`;

    expect(result).toContain(expected);
  });

  it('Generates liquidTags without localization', () => {
    const entry = new Entry('anId', 'aCustomContentType', [field], 'anSpaceId', 'apiToken');
    const result = entry.generateLiquidTags([]);

    expect(result).toEqual(['{{response.data.blogPost.title}}']);
  });

  it('Generates liquidTags with localization', () => {
    const result = entryLocalized.generateLiquidTags(locales);

    expect(result).toEqual([
      '{{response.data.enUS.title}}',
      '{{response.data.it.title}}',
      '{{response.data.esAR.title}}',
    ]);
  });
});
