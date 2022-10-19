import React from 'react';
import { PageExtensionSDK } from 'contentful-ui-extensions-sdk';
import GqlPlayground from './GqlPlayground';

import { Card, Note } from '@contentful/f36-components';

interface PageProps {
  sdk: PageExtensionSDK;
}

const Page = (props: PageProps) => {
  const { sdk } = props;
  const { parameters } = sdk;
  // @ts-ignore
  const cpaToken = parameters?.installation?.cpaToken;
  const spaceId = sdk.ids.space;
  const spaceEnvironment = sdk.ids.environment;
  const spaceEnvironmentAlias = sdk.ids.environmentAlias;

  return cpaToken ? (
    <GqlPlayground {...{ cpaToken, spaceId, spaceEnvironment, spaceEnvironmentAlias }} />
  ) : (
    <Card style={{ margin: '1em' }}>
      <Note variant="warning">
        To use GraphQL playground. Please define the CPA installation parameter in your app
        configuration.
      </Note>
    </Card>
  );
};

export default Page;
