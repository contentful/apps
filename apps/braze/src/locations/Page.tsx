import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Text,
  Badge,
  Spinner,
  Button,
  Flex,
  Heading,
  Subheading,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { fetchBrazeConnectedEntries } from '../utils/fetchBrazeConnectedEntries';
import InformationWithLink from '../components/InformationWithLink';
import { styles } from './Page.styles';
import Splitter from '../components/Splitter';
import { createClient } from 'contentful-management';
import { Entry } from '../fields/Entry';
import { BRAZE_CONTENT_BLOCK_DOCUMENTATION } from '../utils';
import { Field } from '../fields/Field';

const getStatusBadge = (status: string) => {
  if (status.toLowerCase() === 'published') {
    return <Badge variant="positive">Published</Badge>;
  }
  return <Badge variant="warning">Draft</Badge>;
};

const getUpdatedLabel = (dateString: string | undefined) => {
  if (!dateString) {
    return '-';
  }
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getConnectedFieldsCount = (connectedFields: Field[]) => {
  return connectedFields.length;
};

function LoadingState() {
  return (
    <Flex alignItems="center" justifyContent="center" className={styles.loading}>
      <Spinner size="large" />
      <Text marginLeft="spacingM">Loading...</Text>
    </Flex>
  );
}

type MessageProps = {
  title: string;
  message: string;
};
function DisplayMessage({ title, message }: MessageProps) {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      className={styles.emptyComponentContainer}>
      <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold" marginBottom="spacingXs">
        {title}
      </Text>
      <Text fontColor="gray600">{message}</Text>
    </Flex>
  );
}

function ConnectedEntriesTable({ entries }: { entries: Entry[] }) {
  return (
    <Box marginTop="spacingXl">
      <Flex justifyContent="end" alignItems="center" marginBottom="spacingXs">
        <Text fontColor="gray600" fontSize="fontSizeS">
          Connected entries: {entries.length}/25
        </Text>
      </Flex>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Entry name</Table.Cell>
            <Table.Cell>Content type</Table.Cell>
            <Table.Cell>Updated</Table.Cell>
            <Table.Cell>Status</Table.Cell>
            <Table.Cell>Connected fields</Table.Cell>
            <Table.Cell align="center" className={styles.buttonCell} />
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {entries.map((entry) => {
            const name = entry.title;
            const contentType = entry.contentType;
            const updated = getUpdatedLabel(entry.updatedAt);
            const status = entry.state;
            const connectedCount = getConnectedFieldsCount(entry.fields);
            return (
              <Table.Row key={entry.id}>
                <Table.Cell>{name}</Table.Cell>
                <Table.Cell>{contentType}</Table.Cell>
                <Table.Cell>{updated}</Table.Cell>
                <Table.Cell>{getStatusBadge(status)}</Table.Cell>
                <Table.Cell>{connectedCount}</Table.Cell>
                <Table.Cell align="center" className={styles.buttonCell}>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                      // Todo : implement
                    }}>
                    View fields
                  </Button>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Box>
  );
}

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );

  useEffect(() => {
    setLoading(true);
    fetchBrazeConnectedEntries(
      cma,
      sdk.parameters?.installation?.contentfulApiKey,
      sdk.ids.space,
      sdk.ids.environment,
      sdk.locales.default
    )
      .then((entries) => {
        setEntries(entries);
      })
      .catch((e) => {
        setError('Error loading connected entries');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const hasConnectedEntries = () => {
    return entries.length > 0;
  };

  return (
    <Flex justifyContent="center" paddingLeft="spacing2Xl" paddingRight="spacing2Xl">
      <Box className={styles.container}>
        <Heading
          as="h1"
          marginTop="spacingS"
          marginBottom="spacingS"
          marginRight="spacingM"
          marginLeft="spacingM">
          Braze Content Blocks
        </Heading>
        <Splitter />
        <Box padding="spacingL">
          {hasConnectedEntries() && (
            <>
              <Subheading className={styles.subheading}>
                Content connected to Braze through Content Blocks
              </Subheading>
              <InformationWithLink
                url={BRAZE_CONTENT_BLOCK_DOCUMENTATION}
                linkText="here"
                dataTestId="help-here">
                Learn more about Braze Content Blocks
              </InformationWithLink>
            </>
          )}
          <Box>
            {loading ? (
              <LoadingState />
            ) : error ? (
              <DisplayMessage title="There was an error" message="Please contact support" />
            ) : !hasConnectedEntries() ? (
              <DisplayMessage
                title="No active Braze Content Blocks"
                message="Once you have created Content Blocks, they will display here."
              />
            ) : (
              <ConnectedEntriesTable entries={entries} />
            )}
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default Page;
