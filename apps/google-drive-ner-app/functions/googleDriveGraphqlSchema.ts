import { GraphQLError } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { FunctionEventContext } from '@contentful/node-apps-toolkit';

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
      file: async (_parent, { id, search }, context: FunctionEventContext<Record<string, any>>) => {
        console.log('Google Drive API Request:', { id, search });
        if (!search && !id) {
          throw new GraphQLError('Either "search" or "id" must be provided');
        }

        const { token } = context.appInstallationParameters;

        let files = [];

        if (search) {
          const url = `https://www.googleapis.com/drive/v3/files?q=name contains '${search}'&fields=files(id,name,thumbnailLink)`;

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'content-type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          console.log('SEARCH RESPONSE', { response });

          if (!response.ok) {
            throw new GraphQLError(
              `Google Drive API returned a non-200 status code: ${response.status}`
            );
          }

          const json = await response.json();
          files = json.files ?? [];
        } else if (id) {
          const url = `https://www.googleapis.com/drive/v3/files/${id}`; // ?fields=id,name,thumbnailLink

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'content-type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          console.log('LOOKUP RESPONSE', { response });

          if (!response.ok) {
            throw new GraphQLError(
              `Google Drive API returned a non-200 status code: ${response.status}`
            );
          }

          const json = await response.json();
          files = [json];
        }

        console.log('Google Drive API Response [schema]:', files);
        return {
          items: files.map((file: any) => ({
            id: file.id,
            title: file.name,
            image: file.thumbnailLink,
          })),
        };
      },
    },
  },
});

export { schema };
