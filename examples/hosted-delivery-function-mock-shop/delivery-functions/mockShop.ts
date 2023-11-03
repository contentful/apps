import { DeliveryFunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';

const fieldMappingHandler: EventHandler<'graphql.field.mapping'> = (event) => {
  const fields = event.fields.map(({ contentTypeId, field }) => {
    return {
      contentTypeId,
      fieldId: field.id,
      graphQLOutputType: 'Product',
      graphQLQueryField: 'product',
      graphQLQueryArguments: { id: '' },
    };
  });

  return {
    namespace: 'MockShopTutorial',
    fields,
  };
};

const queryHandler: EventHandler<'graphql.query'> = async (event, context) => {
  const { apiEndpoint } = context.appInstallationParameters;
  const response = await fetch(apiEndpoint, {
    body: JSON.stringify({
      query: event.query,
      operationName: event.operationName,
      variables: event.variables,
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  });

  return response.json();
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
