import { createSchema, createYoga } from 'graphql-yoga';
import { GraphQLError } from 'graphql';

/*
 * We re-create a basic subset of the actual payloads in order to showcase how to wrap a REST API.
 * this schema will be use to handle upcoming graphql queries
 *
 * Source: https://developers.google.com/workspace/drive/api/reference/rest/v3/files
 */
const typeDefs = `
type File {
  id: String!
  name: String!
  iconLink: String!
}

type Query {
  searchFiles(search: String!): [File!]!
  lookupFiles(ids: [ID!]!): [File!]!
}`;

const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      searchFiles: async (_parent, { search }, _context) => {
        /**
         * We grab the query argument `slug` and use it to fetch the character from the PotterDB API.
         */
        const response = await fetch(
          `https://www.googleapis.com/discovery/v1/apis/drive/v3/files?q=${search}`
        );

        if (!response.ok) {
          throw new GraphQLError(
            `Google Drive API returned a non-200 status code: ${response.status}`
          );
        }

        const file = await response.json();

        console.log('GOOGLE DRIVE SEARCHFILES:', file);
        const { files } = file.data;

        /**
         * The PotterDB API returns all the character information, so we grab the subset of it
         * that matches with the defined graphql schema.
         *
         */

        return files;
      },
      lookupFiles: async (_parent, { ids }, _context) => {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${ids}`);

        if (!response.ok) {
          throw new GraphQLError(
            `Google Drive API returned a non-200 status code: ${response.status}`
          );
        }

        const file = await response.json();

        console.log('GOOGLE DRIVE LOOKUP FILES:', file);
        const { files } = file.data;

        return files;
      },
    },
  },
});

const yoga = createYoga({ schema, graphiql: false });
