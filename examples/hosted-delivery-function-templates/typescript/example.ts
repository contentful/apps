import { DeliveryFunctionEventHandlers, DeliveryFunctionRequestEventType } from '@contentful/node-apps-toolkit';

export const handlers: DeliveryFunctionEventHandlers = {
  [DeliveryFunctionRequestEventType.GRAPHQL_FIELD_MAPPING]: async (event, context) => {
    const result = []
    const fields = event.fields;
    fields.forEach(({ contentTypeId, field }) => {
      result.push({
        contentTypeId,
        fieldId: field.id,
        graphQLOutputType: 'Product',
        graphQLQueryField: 'product',
        graphQLQueryArgument: 'id'
      })
    })
    return result;
  },
  [DeliveryFunctionRequestEventType.GRAPHQL_QUERY]: async (event, context) => {
    return {
      data: {},
      errors: []
    }
  }
}
