import {
  DeliveryFunctionEventHandler as EventHandler,
  DeliveryFunctionEventType as EventType,
} from '@contentful/node-apps-toolkit';

const GRAPHQL_FIELD_MAPPING_EVENT = 'graphql.field.mapping';
const GRAPHQL_QUERY_EVENT = 'graphql.query';

const fieldMappingHandler: EventHandler<typeof GRAPHQL_FIELD_MAPPING_EVENT> = (event, context) => {
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

const queryHandler: EventHandler<typeof GRAPHQL_QUERY_EVENT> = (event, context) => {
  return {
    data: {},
    errors: [],
  };
};

export const handler: EventHandler<EventType> = (event, context) => {
  if (event.type === GRAPHQL_FIELD_MAPPING_EVENT) {
    return fieldMappingHandler(event, context);
  }
  if (event.type === GRAPHQL_QUERY_EVENT) {
    return queryHandler(event, context);
  }
  throw new Error('Unknown Event');
};
