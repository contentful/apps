import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Playground, store, getQuery } from 'graphql-playground-react';
import stripIndent from 'strip-indent';
import { Note } from '@contentful/forma-36-react-components';
import { DialogAppSDK, PageAppSDK } from '@contentful/app-sdk';

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
  sdk: PageAppSDK | DialogAppSDK;
  cpaToken: string;
  spaceId: string;
  spaceEnvironment: string;
  spaceEnvironmentAlias: string | undefined;
  entry?: Entry;
}

function formatQuery(query: string) {
  return stripIndent(query)
    .split('\n')
    .filter((line) => !!line)
    .join('\n');
}

function GqlPlayground(props: GqlPlaygroundProps) {
  const { sdk, cpaToken, entry, spaceId, spaceEnvironment, spaceEnvironmentAlias } = props;

  const [hasCollection, setHasCollection] = useState<boolean>();

  const tabConfig = {
    endpoint: `https://${sdk.hostnames.graphql}/content/v1/spaces/${spaceId}/environments/${
      spaceEnvironmentAlias || spaceEnvironment
    }`,
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

  const settings = { 'editor.theme': 'light' };

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const query: string = getQuery(store.getState());
      setHasCollection(query.toLowerCase().includes('collection'));
    });
    return unsubscribe;
  }, []);

  return (
    <>
      {hasCollection && (
        <Note>
          Did you know that the default limit for a collection is <b>100</b>, lowering this would
          decrease your query complexity!{' '}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.contentful.com/developers/docs/references/graphql/#/reference/collection-fields/arguments">
            Learn more
          </a>
        </Note>
      )}
      <Provider store={store}>
        <Playground tabs={tabs} settings={settings} fixedEndpoint={true} {...tabConfig} />
      </Provider>
    </>
  );
}

export default GqlPlayground;
