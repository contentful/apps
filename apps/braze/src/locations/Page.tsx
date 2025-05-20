import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Text,
  Badge,
  Spinner,
  Button,
  Note,
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

const HELP_URL =
  'https://www.braze.com/docs/api/endpoints/templates/content_blocks_templates/post_create_email_content_block';

const getStatusBadge = (status: string) => {
  if (status.toLowerCase() === 'published') {
    return <Badge variant="positive">Published</Badge>;
  }
  return <Badge variant="warning">Draft</Badge>;
};

const getUpdatedLabel = (dateString: string) => {
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

const getConnectedFieldsCount = (connectedFields: any) => {
  return connectedFields.length;
};

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
    setError(null);
    fetchBrazeConnectedEntries(cma, sdk.ids.space, sdk.ids.environment || 'master')
      .then((entries) => {
        setEntries(entries);
        setLoading(false);
      })
      .catch((e) => {
        console.log('Error: ', e);
        setError('Error loading connected entries');
        setLoading(false);
      });
  }, []);

  return (
    <Flex justifyContent="center" padding="spacing2Xl">
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
          <Subheading className={styles.subheading}>
            Content connected to Braze through Content Blocks
          </Subheading>
          <InformationWithLink url={HELP_URL} linkText="here" dataTestId="help-here">
            Learn more about Braze Content Blocks
          </InformationWithLink>
          <Box>
            {loading ? (
              <Flex alignItems="center" justifyContent="center" padding="spacingL">
                <Spinner size="large" />
                <Text marginLeft="spacingM">Loading...</Text>
              </Flex>
            ) : error ? (
              <Box marginBottom="spacingL">
                <Note variant="negative" title="Error">
                  {error}
                </Note>
              </Box>
            ) : entries.length === 0 ? (
              <Box marginBottom="spacingL">
                <Note variant="warning" title="No connected entries">
                  There are no entries connected to Braze Content Blocks.
                </Note>
              </Box>
            ) : (
              <Box marginTop="spacingXl">
                <Flex justifyContent="end" alignItems="center" marginBottom="spacingXs">
                  <Text fontColor="gray600" fontSize="fontSizeS">
                    Connected entries: {entries.length}/25
                  </Text>
                </Flex>
                <Table>
                  <Table.Head>
                    <Table.Row>
                      <Table.Cell as="th">Entry name</Table.Cell>
                      <Table.Cell as="th">Content type</Table.Cell>
                      <Table.Cell as="th">Updated</Table.Cell>
                      <Table.Cell as="th">Status</Table.Cell>
                      <Table.Cell as="th">Connected fields</Table.Cell>
                      <Table.Cell as="th" />
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {entries.map((entry) => {
                      const name = entry.title;
                      const contentType = entry.contentType;
                      const updated = getUpdatedLabel(entry.updatedAt);
                      const status = entry.state;
                      const connectedCount = getConnectedFieldsCount(entry.fields); // Todo : this are not the real connected fields
                      return (
                        <Table.Row key={entry.id}>
                          <Table.Cell>{name}</Table.Cell>
                          <Table.Cell>{contentType}</Table.Cell>
                          <Table.Cell>{updated}</Table.Cell>
                          <Table.Cell>{getStatusBadge(status)}</Table.Cell>
                          <Table.Cell>{connectedCount}</Table.Cell>
                          <Table.Cell>
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
            )}
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default Page;
