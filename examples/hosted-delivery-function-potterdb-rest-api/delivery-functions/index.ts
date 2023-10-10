import type { DeliveryFunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit'
import { createSchema, createYoga } from 'graphql-yoga'
import { typeDefs } from './schema'
import { NodeRequest } from '@whatwg-node/server/typings/utils'
import { GraphQLError } from 'graphql'

const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      character: async (_parent, { slug }, _context) => {
        const response = await fetch(`https://api.potterdb.com/v1/characters/${slug}`)

        if (!response.ok) {
          throw new GraphQLError(`PotterDB returned a non-200 status code: ${response.status}`)
        }
        const character = await response.json()
        const {
          name,
          alias_names: aliasNames,
          family_members: familyMembers,
          house,
          image,
          titles,
          wiki,
        } = character.data.attributes

        return {
          slug,
          name,
          aliasNames,
          familyMembers,
          house,
          image,
          titles,
          wiki,
        }
      },
    },
  },
})
const yoga = createYoga({ schema, graphiql: false })

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
  const { query, operationName, variables } = event
  const body = JSON.stringify({
    query,
    operationName,
    variables,
  })

  const request: NodeRequest = {
    body,
    method: 'post',
    headers: {
      accept: 'application/graphql-response+json',
      'content-type': 'application/json',
    },
  }
  const response = await yoga.fetch('http://this-does-not-matter.com/graphql', request, context)

  if (response.type !== 'default') {
    throw new Error('Unsupported GraphQL result type')
  }

  return response.json()
}

export const handler: EventHandler = (event, context) => {
  if (event.type === 'graphql.field.mapping') {
    return fieldMappingHandler(event, context)
  }
  if (event.type === 'graphql.query') {
    return queryHandler(event, context)
  }
  throw new Error('Unknown Event')
}
