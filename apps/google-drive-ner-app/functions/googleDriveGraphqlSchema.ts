import { GraphQLError } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = `
type File {
  id: String
  title: String
  image: String
}

type FileResult {
  items: [File!]!
}

type Query {
  file(id: String, search: String): FileResult
}
`;

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Query: {
      file: async (_parent, { id, search }, _context) => {
        // if (!search && !id) {
        //   throw new GraphQLError('Either "search" or "id" must be provided');
        // }

        // let files = [];

        // if (search) {
        //   const url = `https://www.googleapis.com/drive/v3/files?q=name contains '${search}'&fields=files(id,name,thumbnailLink)`;

        //   const response = await fetch(url, {
        //     method: 'GET',
        //     headers: {
        //       Accept: 'application/json',
        //       'content-type': 'application/json',
        //     },
        //   });

        //   if (!response.ok) {
        //     throw new GraphQLError(
        //       `Google Drive API returned a non-200 status code: ${response.status}`
        //     );
        //   }

        //   const json = await response.json();
        //   files = json.files ?? [];
        // } else if (id) {
        //   const url = `https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,thumbnailLink`;

        //   const response = await fetch(url, {
        //     method: 'GET',
        //     headers: {
        //       Accept: 'application/json',
        //       'content-type': 'application/json',
        //     },
        //   });

        //   if (!response.ok) {
        //     throw new GraphQLError(
        //       `Google Drive API returned a non-200 status code: ${response.status}`
        //     );
        //   }

        //   const json = await response.json();
        //   files = [json];
        // }

        // console.log('Google Drive API Response:', files);
        return {
          items: [
            {
              id: '1234',
              title: 'Sample File',
              image: 'https://example.com/image.png',
            },
          ],
        };
      },
    },
  },
});

export { schema };
