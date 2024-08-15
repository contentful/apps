import React, { useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { Card, Note } from '@contentful/forma-36-react-components';
import { GraphiqlView } from './GraphiqlView';
import { Workbench } from '@contentful/f36-workbench';
import { useQuery } from '@tanstack/react-query';
import { Modal, ModalContent } from '@contentful/f36-components';

interface PageProps {
  sdk: PageAppSDK;
}

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
    <Workbench>
      <Workbench.Content type={'full'}>
        <GraphiqlView
          spaceId={spaceId}
          environmentId={spaceEnvironmentAlias || spaceEnvironment}
          cpaToken={cpaToken}
          graphqlHost={sdk.hostnames.graphql}
        />

        <Modal isShown={isModelOpen} onClose={() => setModelOpen(false)}>
          <ModalContent>Go Vikas</ModalContent>
        </Modal>
      </Workbench.Content>
    </Workbench>
  ) : (
    <Card style={{ margin: '1em' }}>
      <Note noteType="warning">
        To use GraphQL playground. Please define the CPA installation parameter in your app
        configuration.
      </Note>
    </Card>
  );
};

export default Page;
