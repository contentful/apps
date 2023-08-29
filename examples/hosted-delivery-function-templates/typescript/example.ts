import {
  DeliveryFunctionEventHandler as EventHandler,
  DeliveryFunctionEventType as EventType,
} from '@contentful/node-apps-toolkit';

const fieldMappingHandler: EventHandler<EventType.GRAPHQL_FIELD_MAPPING> = (event, context) => {
  const fields = event.fields.map(({ contentTypeId, field }) => {
    return {
      contentTypeId,
      fieldId: field.id,
      graphQLOutputType: 'Foo',
      graphQLQueryField: 'bar',
      graphQLQueryArguments: { id: '' },
    };
  });

  return {
    namespace: 'MyApp',
    fields,
  };
};

const queryHandler: EventHandler<EventType.GRAPHQL_QUERY> = (event, context) => {
  return {
    data: {},
    errors: [],
  };
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
