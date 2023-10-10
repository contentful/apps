/*
 * We re-create a subset of the actual payloads here
 * in order to showcase how to wrap a REST API.
 */
export const typeDefs = `
type Character {
  slug: String!
  name: String
  aliasNames: [String!]
  familyMembers: [String!]
  house: String
  image: String
  titles: [String!]
  wiki: String
}

type Query {
  character(slug: String!): Character
}`
