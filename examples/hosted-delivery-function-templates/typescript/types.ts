export declare enum DeliveryFunctionEventType {
  GRAPHQL_FIELD_MAPPING = 'graphql.field.mapping',
  GRAPHQL_QUERY = 'graphql.query',
}
type GraphQLFieldTypeMappingRequest = {
  type: DeliveryFunctionEventType.GRAPHQL_FIELD_MAPPING;
  fields: {
    contentTypeId: string;
    field: Field;
  }[];
};
type Field = {
  id: string;
  type: string;
};
export type GraphQLFieldTypeMappingResponse = {
  namespace: string;
  fields: GraphQLFieldTypeMapping[];
};
export type GraphQLFieldTypeMapping = {
  contentTypeId: string;
  fieldId: string;
  graphQLOutputType: string;
  graphQLQueryField: string;
  graphQLQueryArguments: Record<string, string>;
};
type GraphQLQueryRequest = {
  type: DeliveryFunctionEventType.GRAPHQL_QUERY;
  query: string;
  isIntrospectionQuery: boolean;
  variables: Record<string, unknown>;
  operationName?: string;
};
/**
 * @see https://spec.graphql.org/October2021/#sec-Response
 */
export type GraphQLQueryResponse = {
  data?: Record<string, any> | null;
  errors?: readonly Record<string, any>[];
  extensions?: Record<string, unknown>;
};
/**
 * P: Possibility to type app installation parameters
 */
export type DeliveryFunctionEventContext<P extends Record<string, any> = Record<string, any>> = {
  spaceId: string;
  environmentId: string;
  appInstallationParameters: P;
};
type DeliveryFunctionEventHandlers = {
  [DeliveryFunctionEventType.GRAPHQL_FIELD_MAPPING]: {
    event: GraphQLFieldTypeMappingRequest;
    response: GraphQLFieldTypeMappingResponse;
  };
  [DeliveryFunctionEventType.GRAPHQL_QUERY]: {
    event: GraphQLQueryRequest;
    response: GraphQLQueryResponse;
  };
};
/**
 * Event handler type that needs to be exported as `handler` from your delivery function.
 * e.g. `const handler: DeliveryFunctionEventHandler = (event, context) => { ... }`
 *
 * This type can also be used to construct helper functions for specific events
 * e.g. `const queryHandler: DeliveryFunctionEventHandler<'graphql.query'> = (event, context) => { ... }
 */
export type DeliveryFunctionEventHandler<
  K extends keyof DeliveryFunctionEventHandlers = keyof DeliveryFunctionEventHandlers,
  P extends Record<string, any> = Record<string, any>
> = (
  event: DeliveryFunctionEventHandlers[K]['event'],
  context: DeliveryFunctionEventContext<P>
) =>
  | Promise<DeliveryFunctionEventHandlers[K]['response']>
  | DeliveryFunctionEventHandlers[K]['response'];
export {};
