import { DeliveryFunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';

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
  if (event.type === 'graphql.field.mapping') {
    return fieldMappingHandler(event, context);
  }
  if (event.type === 'graphql.query') {
    return queryHandler(event, context);
  }
  throw new Error('Unknown Event');
};
