import {
  DeliveryFunctionEventHandler,
  DeliveryFunctionRequestEventType,
  GraphQLQueryResponse,
} from '@contentful/node-apps-toolkit';
import { fetch } from 'undici';

const fieldMappingHandler: DeliveryFunctionEventHandler<
  DeliveryFunctionRequestEventType.GRAPHQL_FIELD_MAPPING
> = (event, context) => {
  const result = event.fields.map(({ contentTypeId, field }) => {
    return {
      contentTypeId,
      fieldId: field.id,
      graphQLOutputType: 'Starship',
      graphQLQueryField: 'starship',
      graphQLQueryArgument: 'id',
    };
  });

  return result;
};

const queryHandler: DeliveryFunctionEventHandler<DeliveryFunctionRequestEventType.GRAPHQL_QUERY> = (
  event,
  context
) => {
  return fetch('https://swapi-graphql.netlify.app/.netlify/functions/index', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: event.query,
      operationName: event.operationName,
      variables: event.variables,
    }),
  }).then((response) => response.json() as GraphQLQueryResponse);
};

export const handler: DeliveryFunctionEventHandler = (event, context) => {
  if (event.type === DeliveryFunctionRequestEventType.GRAPHQL_FIELD_MAPPING) {
    return fieldMappingHandler(event, context);
  }
  if (event.type === DeliveryFunctionRequestEventType.GRAPHQL_QUERY) {
    return queryHandler(event, context);
  }
  throw new Error('Unknown Event');
};
