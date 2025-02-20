const EventType = {
  GRAPHQL_FIELD_MAPPING: 'graphql.field.mapping',
  GRAPHQL_QUERY: 'graphql.query',
};

const fieldMappingHandler = (event, context) => {
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

const queryHandler = (event, context) => {
  return {
    data: {},
    errors: [],
  };
};

export const handler = (event, context) => {
  if (event.type === EventType.GRAPHQL_FIELD_MAPPING) {
    return fieldMappingHandler(event, context);
  }
  if (event.type === EventType.GRAPHQL_QUERY) {
    return queryHandler(event, context);
  }
  throw new Error('Unknown Event');
};
