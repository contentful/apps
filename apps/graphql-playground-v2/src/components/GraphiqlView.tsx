import type { FC } from 'react';
import React from 'react';
import { GraphiQL } from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import 'graphiql/graphiql.min.css';
import { Box } from '@contentful/f36-components';
import { css } from '@emotion/css';

const style = css({
  height: '800px',
  minHeight: '100vh',
});

type Props = {
  spaceId: string;
  environmentId: string;
  cpaToken: string;
  graphqlHost: string;
};

export const GraphiqlView: FC<Props> = ({ environmentId, spaceId, cpaToken, graphqlHost }) => {
  return (
    <Box className={style}>
      <GraphiQL
        fetcher={createGraphiQLFetcher({
          url: `https://${graphqlHost}/content/v1/spaces/${spaceId}/environments/${environmentId}`,
          headers: {
            Authorization: `Bearer ${cpaToken}`,
          },
        })}
      />
    </Box>
  );
};
