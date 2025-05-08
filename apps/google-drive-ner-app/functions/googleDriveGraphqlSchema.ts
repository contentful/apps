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
        if (!search && !id && (!ids || ids.length === 0)) {
          throw new GraphQLError('Either "search" or "ids" or id  must be provided');
        }

        const { token } = context.appInstallationParameters;

        console.log('Google Drive API Token:', token);

        let files = [];

        if (id) {
          const url = `https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,thumbnailLink`;

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'content-type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          console.log('Graph QL Event handler Response from Google Drive API', { response });

          if (!response.ok) {
            throw new GraphQLError(
              `Google Drive API returned a non-200 status code: ${response.status}`
            );
          }

          const result = await response.json();
          files = [result];
        } else if (search) {
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
          // todo : fix any type
          const filePromises = ids.map(async (fileId: any) => {
            const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,thumbnailLink`;
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
