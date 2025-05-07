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
  file(id: ID, ids: [ID!], search: String): FileResult
}
`;

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Query: {
      file: async (
        _parent,
        { id, ids, search },
        context: FunctionEventContext<Record<string, any>>
      ) => {
        console.log('Google Drive API Request:', { ids, search });
        if (!search && !ids) {
          throw new GraphQLError('Either "search" or "ids" must be provided');
        }

        const { token } = context.appInstallationParameters;

        console.log('Google Drive API Token:', token);

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
        } else if (ids && ids.length > 0) {
          // Make individual requests for each ID
          const filePromises = ids.map(async (fileId) => {
            const url = `https://www.googleapis.com/drive/v3/files/${fileId}&fields=id,name,thumbnailLink`;
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                'content-type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              console.error(`Failed to fetch file ${fileId}: ${response.status}`);
              return null;
            }

            return response.json();
          });

          const results = await Promise.all(filePromises);
          files = results.filter((file): file is any => file !== null);
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
