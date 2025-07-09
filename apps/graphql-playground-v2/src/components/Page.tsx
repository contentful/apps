import React, { useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { css } from '@emotion/css';
import { GraphiqlView } from './GraphiqlView';
import { useQuery } from '@tanstack/react-query';
import { Card, GlobalStyles, Modal, ModalContent, Note } from '@contentful/f36-components';
import { Layout } from '@contentful/f36-layout';

interface PageProps {
  sdk: PageAppSDK;
}

export const styles = {
  body: css({
    // emotion version mismatch between this app and F36 requires this override
    padding: '0 !important',
  }),
};

const Page = (props: PageProps) => {
  const { sdk } = props;
  const { parameters } = sdk;
  // @ts-ignore
  const cpaToken = parameters?.installation?.cpaToken;
  const spaceId = sdk.ids.space;
  const spaceEnvironment = sdk.ids.environment;
  const spaceEnvironmentAlias = sdk.ids.environmentAlias;

  const [isModelOpen, setModelOpen] = useState(false);

  const query = useQuery({
    queryKey: ['space', spaceId, 'environment', spaceEnvironmentAlias || spaceEnvironment],
    queryFn: () =>
      fetch(
        `https://${sdk.hostnames.graphql}/content/v1/spaces/${spaceId}/environments/${
          spaceEnvironmentAlias || spaceEnvironment
        }`,
        {
          method: 'POST',
          headers: new Headers({
            Authorization: `Bearer ${cpaToken}`,
          }),
        }
      ).then((res) => res.json()),
  });

  return cpaToken ? (
    <Layout variant="fullscreen" offsetTop={0}>
      <Layout.Body className={styles.body}>
        <GraphiqlView
          spaceId={spaceId}
          environmentId={spaceEnvironmentAlias || spaceEnvironment}
          cpaToken={cpaToken}
          graphqlHost={sdk.hostnames.graphql}
        />
        <Modal isShown={isModelOpen} onClose={() => setModelOpen(false)}>
          <ModalContent>Go Vikas</ModalContent>
        </Modal>
      </Layout.Body>
    </Layout>
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
