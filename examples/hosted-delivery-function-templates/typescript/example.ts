import { DeliveryFunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';

const GRAPHQL_FIELD_MAPPING_EVENT = 'graphql.field.mapping';
const GRAPHQL_QUERY_EVENT = 'graphql.query';

const fieldMappingHandler: EventHandler<'graphql.field.mapping'> = (event, context) => {
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

const queryHandler: EventHandler<'graphql.query'> = (event, context) => {
  return {
    data: {},
    errors: [],
  };
};

export const handler: EventHandler = (event, context) => {
  if (event.type === GRAPHQL_FIELD_MAPPING_EVENT) {
    return fieldMappingHandler(event, context);
  }
  if (event.type === GRAPHQL_QUERY_EVENT) {
    return queryHandler(event, context);
  }
  throw new Error('Unknown Event');
};
