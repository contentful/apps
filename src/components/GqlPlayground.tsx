import React from "react";
import { Provider } from "react-redux";
import { Playground, store } from "graphql-playground-react";
import stripIndent from "strip-indent";

interface Sys {
  id: String;
}

interface ContentType {
  sys: Sys;
}

interface Entry {
  id: string;
  contentType: ContentType;
}

interface GqlPlaygroundProps {
  cpaToken: string;
  spaceId: string;
  spaceEnvironment: string;
  spaceEnvironmentAlias: string | undefined;
  entry?: Entry;
}

function formatQuery(query: string) {
  return stripIndent(query)
    .split("\n")
    .filter((line) => !!line)
    .join("\n");
}

function GqlPlayground(props: GqlPlaygroundProps) {
  const { cpaToken, entry, spaceId, spaceEnvironment, spaceEnvironmentAlias } = props;

  const tabConfig = {
    endpoint: `https://graphql.contentful.com/content/v1/spaces/${spaceId}/environments/${spaceEnvironmentAlias || spaceEnvironment}`,
    headers: {
      Authorization: `Bearer ${cpaToken}`,
    },
  };

  const tabs = entry
    ? [
        {
          ...tabConfig,
          name: `${entry.contentType.sys.id}`,
          query: formatQuery(`
            query ${entry.contentType.sys.id}EntryQuery {
              ${entry.contentType.sys.id}(id: "${entry.id}") {
                sys {
                  id
                }
                # add the fields you want to query
              }
            }`),
        },
        {
          ...tabConfig,
          name: `${entry.contentType.sys.id}Collection`,
          query: formatQuery(`
            query ${entry.contentType.sys.id}CollectionQuery {
              ${entry.contentType.sys.id}Collection {
                items {
                  sys {
                    id
                  }
                  # add the fields you want to query
                }
              }
            }`),
        },
      ]
    : [
        {
          ...tabConfig,
          name: `Query`,
          query: formatQuery(`
            query {
              # add your query
            }`),
        },
      ];

  const settings = { "editor.theme": "light" };

  return (
    <Provider store={store}>
      <Playground
        tabs={tabs}
        settings={settings}
        fixedEndpoint={true}
        {...tabConfig}
      />
    </Provider>
  );
}

export default GqlPlayground;
