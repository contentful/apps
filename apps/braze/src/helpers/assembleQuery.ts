import { Field } from '../fields/Field';
import { SAVED_RESPONSE } from './utils';

export function generateConnectedContentCall(query: string, spaceId: string, token: string) {
  return `{% capture body %}
  ${query}
{% endcapture %}

{% connected_content
    https://graphql.contentful.com/content/v1/spaces/${spaceId}
    :method post
    :headers {"Authorization": "Bearer ${token}"}
    :body {{body}}
    :content_type application/json
    :save ${SAVED_RESPONSE}
%}`;
}

export async function getGraphQLResponse(spaceId: string, token: string, query: string) {
  const response = await fetch(`https://graphql.contentful.com/content/v1/spaces/${spaceId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: query,
  });
  return response.json();
}

export function assembleQuery(contentTypeId: string, entryId: string, entryFields: Field[]) {
  return `{"query":"{${contentTypeId}(id:\\"${entryId}\\"){${assembleFieldsQuery(entryFields)}}}"}`;
}

function assembleFieldsQuery(entryFields: Field[]): string {
  return entryFields.map((field) => field.generateQuery()).join(' ');
}
