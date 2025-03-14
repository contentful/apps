import type {
  FunctionEventHandler,
  FunctionEventType,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';

type InstallationParameters = {
  apiEndpoint: string;
  url: string;
};

type EventHandler = FunctionEventHandler<FunctionEventType, InstallationParameters>;
type QueryHandler = FunctionEventHandler<FunctionTypeEnum.GraphqlQuery, InstallationParameters>;
type FieldMappingHandler = FunctionEventHandler<FunctionTypeEnum.GraphqlFieldMapping>;

const fieldMappingHandler: FieldMappingHandler = (event) => {
  // Define the field mapping to map the external api to
  // the field in the content type
  const fields = event.fields.map(({ contentTypeId, field }) => ({
    contentTypeId,
    fieldId: field.id,
    graphQLOutputType: 'Product',
    graphQLQueryField: 'product',
    graphQLQueryArguments: { id: '' },
  }));

  // Return the mapping and the namespace.
  // The namespace is used to namespace the
  // GraphQL types from the third party API.
  return {
    namespace: 'MockShop',
    fields,
  };
};

const queryHandler: QueryHandler = async (event, context) => {
  // Installation parameters are defined in the app definition
  // and set per installation.
  const { apiEndpoint } = context.appInstallationParameters;

  let mockShopUrl = apiEndpoint;
  if (!mockShopUrl) {
    mockShopUrl = 'https://mock.shop/api';
    console.warn(`No API url configured, falling back to '${mockShopUrl}'`);
  }

  // Make a request to the third party API.
  // The expected return type aligns with the
  // one outlined in the GraphQL specs:
  // https://spec.graphql.org/October2021/#sec-Response
  const response = await fetch(mockShopUrl, {
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
