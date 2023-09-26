import { DeliveryFunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit'

const GRAPHQL_FIELD_MAPPING_EVENT = 'graphql.field.mapping'
const GRAPHQL_QUERY_EVENT = 'graphql.query'

const fieldMappingHandler: EventHandler<'graphql.field.mapping'> = (event, context) => {
  const fields = event.fields.map(({ contentTypeId, field }) => {
    return {
      contentTypeId,
      fieldId: field.id,
      graphQLOutputType: 'Character',
      graphQLQueryField: 'character',
      graphQLQueryArguments: { slug: '' },
    }
  })

  return {
    namespace: 'PotterDB',
    fields,
  }
}

const queryHandler: EventHandler<'graphql.query'> = async (event, context) => {
  /*
   * Forwards the GraphQL query to the PotterDB GraphQL API as is.
   * The `event` contains a boolean `isIntrospectionQuery` that can be used to
   * determine if the query is an introspection query. This is useful when
   * the introspection requires different handling that the actual query.
   */
  const response = await fetch('https://api.potterdb.com/graphql', {
    body: JSON.stringify({
      query: event.query,
      operationName: event.operationName,
      variables: event.variables,
    }),
    method: 'POST',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
  })

  return response.json()
}

export const handler: EventHandler = (event, context) => {
  if (event.type === GRAPHQL_FIELD_MAPPING_EVENT) {
    return fieldMappingHandler(event, context)
  }
  if (event.type === GRAPHQL_QUERY_EVENT) {
    return queryHandler(event, context)
  }
  throw new Error('Unknown Event')
}
