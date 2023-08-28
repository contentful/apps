import {
  DeliveryFunctionEventContext,
  DeliveryFunctionEventHandler as EventHandler,
  DeliveryFunctionEventType as EventType,
  GraphQLQueryResponse,
} from '@contentful/node-apps-toolkit';
import { fetch } from 'undici';

type AppInstallationParameters = {
  namespaceOverride?: string;
};

const fieldMappingHandler: EventHandler<EventType.GRAPHQL_FIELD_MAPPING> = (
  event,
  context: DeliveryFunctionEventContext<AppInstallationParameters>
) => {
  const fields = event.fields.map(({ contentTypeId, field }) => {
    return {
      contentTypeId,
      fieldId: field.id,
      graphQLOutputType: 'Starship',
      graphQLQueryField: 'starship',
      graphQLQueryArguments: { id: '' },
    };
  });

  return {
    namespace: context.appInstallationParameters.namespaceOverride || 'StarWars',
    fields,
  };
};

const queryHandler: EventHandler<EventType.GRAPHQL_QUERY> = (event, context) => {
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

export const handler: EventHandler = (event, context) => {
  if (event.type === EventType.GRAPHQL_FIELD_MAPPING) {
    return fieldMappingHandler(event, context);
  }
  if (event.type === EventType.GRAPHQL_QUERY) {
    return queryHandler(event, context);
  }
  throw new Error('Unknown Event');
};
