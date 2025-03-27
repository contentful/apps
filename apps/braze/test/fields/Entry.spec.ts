import { describe, expect, it } from 'vitest';
import { BasicField } from '../../src/fields/BasicField';
import { Entry } from '../../src/fields/Entry';
import { removeIndentation } from '../../src/utils';

describe('Entry', () => {
  const field = new BasicField('title', 'Title', 'blogPost', false);
  field.selected = true;
  const localizedField = new BasicField('title', 'Title', 'blogPost', true);
  localizedField.selected = true;
  const entry = new Entry('anId', 'aCustomContentType', 'aTitle', [field], 'anSpaceId', 'apiToken');
  const entryLocalized = new Entry(
    'anId',
    'aCustomContentType',
    'aTitle',
    [localizedField],
    'anSpaceId',
    'apiToken'
  );
  const locales = ['en-US', 'it', 'es-AR'];

  it('Generates content call with no fields', () => {
    const entry = new Entry('anId', 'aCustomContentType', 'aTitle', [], 'anSpaceId', 'apiToken');
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
      :retry
%}

{% if response.__http_status_code__ != 200 %}
  {% abort_message('Could not connect to Contentful') %}
{% endif %}`);

    expect(removeIndentation(result)).toEqual(expected);
  });

  it('Asembles query for body with a localized entry', () => {
    const result = entry.assembleQuery([]);
    const expectedQueryBody = `{"query":"{aCustomContentType(id:\\"anId\\"){title}}"}`;

    expect(result).toEqual(expectedQueryBody);
  });

  it('Asembles query for body with a localized entry', () => {
    const result = entryLocalized.assembleQuery(locales);
    const expected = `{"query":"{enUS: aCustomContentType(id:\\"anId\\", locale:\\"en-US\\"){title},it: aCustomContentType(id:\\"anId\\", locale:\\"it\\"){title},esAR: aCustomContentType(id:\\"anId\\", locale:\\"es-AR\\"){title}}"}`;

    expect(result).toEqual(expected);
  });

  it('Generates liquidTags without localization', () => {
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
