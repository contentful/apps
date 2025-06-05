import React, { useEffect, useState } from 'react';

import {
  Box,
  Heading,
  Flex,
  Spinner,
  Badge,
  Table,
  Text,
  Checkbox,
  Stack,
  TextLink,
  Pagination,
} from '@contentful/f36-components';
import { NavList } from '@contentful/f36-navlist';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ExternalLinkIcon } from '@contentful/f36-icons';

import { ContentTypeField, Entry, Status } from './types';
import { styles } from './styles';

const PAGE_SIZE_OPTIONS = [15, 50, 100];
import { ContentTypeProps } from 'contentful-management';

const Page = () => {
  const sdk = useSDK();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [fields, setFields] = useState<ContentTypeField[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
  const [totalEntries, setTotalEntries] = useState(0);
  const LOCALE = sdk.locales.default;

  const getAllContentTypes = async (): Promise<ContentTypeProps[]> => {
    const allContentTypes: ContentTypeProps[] = [];
    let skip = 0;
    const limit = 1000;
    let fetched: number;

    do {
      const response = await sdk.cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: { skip, limit },
      });
      const items = response.items as ContentTypeProps[];
      allContentTypes.push(...items);
      fetched = items.length;
      skip += limit;
    } while (fetched === limit);

    return allContentTypes;
  };

  useEffect(() => {
    const fetchContentTypes = async (): Promise<void> => {
      setLoading(true);
      try {
        const contentTypes = await getAllContentTypes();
        const sortedContentTypes = contentTypes
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name));

        setContentTypes(sortedContentTypes);
        if (sortedContentTypes.length > 0) {
          setSelectedContentTypeId(sortedContentTypes[0].sys.id);
        }
      } catch (e) {
        setContentTypes([]);
        setSelectedContentTypeId(undefined);
      } finally {
        setLoading(false);
      }
    };
    void fetchContentTypes();
  }, [sdk]);

  useEffect(() => {
    setActivePage(0);
  }, [selectedContentTypeId]);

  useEffect(() => {
    const fetchFieldsAndEntries = async (): Promise<void> => {
      if (!selectedContentTypeId) {
        setEntries([]);
        setFields([]);
        setTotalEntries(0);
        return;
      }
      setEntriesLoading(true);
      try {
        const ct = await sdk.cma.contentType.get({ contentTypeId: selectedContentTypeId });
        setFields(
          ct.fields.map((f: any) => ({
            id: f.id,
            name: f.name,
            type: f.type,
          }))
        );
        const res = await sdk.cma.entry.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          query: {
            content_type: selectedContentTypeId,
            skip: activePage * itemsPerPage,
            limit: itemsPerPage,
          },
        });
        setEntries(res.items || []);
        setTotalEntries(res.total || 0);
      } catch (e) {
        setEntries([]);
        setFields([]);
        setTotalEntries(0);
      } finally {
        setEntriesLoading(false);
      }
    };
    void fetchFieldsAndEntries();
  }, [sdk, selectedContentTypeId, activePage, itemsPerPage]);

  const handleNavClick = (id: string): void => {
    setSelectedContentTypeId(id);
  };

  const selectedContentType = contentTypes.find((ct) => ct.sys.id === selectedContentTypeId);

  const getStatus = (entry: Entry): Status => {
    const { sys } = entry;
    if (!sys.publishedVersion) {
      return { label: 'Draft', color: 'warning' };
    }
    if (sys.version >= sys.publishedVersion + 2) {
      return { label: 'Changed', color: 'primary' };
    }
    if (sys.version === sys.publishedVersion + 1) {
      return { label: 'Published', color: 'positive' };
    }
    return { label: 'Unknown', color: 'negative' };
  };

  const isLocationValue = (value: unknown): value is { lat: number; lon: number } => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'lat' in value &&
      'lon' in value &&
      typeof (value as any).lat === 'number' &&
      typeof (value as any).lon === 'number'
    );
  };

  const isLinkValue = (value: unknown): value is { sys: { linkType: string } } => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'sys' in value &&
      'linkType' in (value as any).sys
    );
  };

  const truncate = (str: string, max: number = 20) =>
    str.length > max ? str.slice(0, max) + ' ...' : str;

  const renderFieldValue = (field: ContentTypeField, value: unknown): string => {
    if (field.type === 'Array' && Array.isArray(value)) {
      const count = value.length;
      if (value[0]?.sys?.linkType === 'Entry') {
        return count === 1 ? '1 reference field' : `${count} reference fields`;
      } else if (value[0]?.sys?.linkType === 'Asset') {
        return count === 1 ? '1 asset' : `${count} assets`;
      } else {
        return truncate(value.join(', '));
      }
    }

    if (field.type === 'Location' && isLocationValue(value)) {
      return truncate(`Lat: ${value.lat}, Lon: ${value.lon}`);
    }
    if (field.type === 'Boolean' && typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (field.type === 'Object' && typeof value === 'object' && value !== null) {
      return truncate(JSON.stringify(value));
    }

    if (field.type === 'Link' && isLinkValue(value) && value.sys.linkType === 'Asset') {
      return `1 asset`;
    }
    if (field.type === 'Link' && isLinkValue(value) && value.sys.linkType === 'Entry') {
      return `1 reference field`;
    }

    if (typeof value === 'object' && value !== null) {
      return '';
    }

    return value !== undefined && value !== null ? truncate(String(value)) : '-';
  };

  const getEntryTitle = (
    entry: Entry,
    fields: ContentTypeField[],
    contentType?: ContentTypeProps
  ): string => {
    let displayFieldId = contentType?.displayField;
    if (!displayFieldId) return 'Untitled';

    const value = entry.fields[displayFieldId]?.[LOCALE];
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'object' && value !== null)
    ) {
      return 'Untitled';
    }
    return String(value);
  };

  const getEntryUrl = (entry: Entry): string => {
    return `https://app.contentful.com/spaces/${sdk.ids.space}/environments/${sdk.ids.environment}/entries/${entry.sys.id}`;
  };

  return (
    <Flex>
      <Box style={styles.mainContent} padding="spacingL">
        <Box style={styles.whiteBox} padding="spacingL">
          <Flex>
            <Flex style={styles.sidebar} padding="spacingL" flexDirection="column" gap="spacingXs">
              <Text fontColor="gray600">Content types</Text>
              <NavList aria-label="Content types" testId="content-types-nav">
                {contentTypes.map((ct) => (
                  <NavList.Item
                    as="button"
                    key={ct.sys.id}
                    isActive={ct.sys.id === selectedContentTypeId}
                    onClick={() => handleNavClick(ct.sys.id)}
                    testId="content-type-nav-item">
                    {ct.name}
                  </NavList.Item>
                ))}
              </NavList>
            </Flex>
            <Box padding="spacingL">
              {loading ? (
                <Spinner />
              ) : (
                <>
                  <Heading>
                    {selectedContentType
                      ? `Bulk edit ${selectedContentType.name}`
                      : 'Bulk Edit App'}
                  </Heading>
                  {entriesLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      <Table testId="bulk-edit-table" style={styles.table}>
                        <Table.Head>
                          <Table.Row>
                            {fields.length > 0 && (
                              <Table.Cell as="th" key="displayName" style={styles.stickyHeader}>
                                Display name
                              </Table.Cell>
                            )}
                            <Table.Cell as="th" key="status" style={styles.tableHeader}>
                              Status
                            </Table.Cell>
                            {fields.map((field) => (
                              <Table.Cell as="th" key={field.id} style={styles.tableHeader}>
                                {truncate(field.name)}
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        </Table.Head>
                        <Table.Body>
                          {entries.map((entry) => {
                            const status = getStatus(entry);
                            return (
                              <Table.Row key={entry.sys.id}>
                                {fields.length > 0 && (
                                  <Table.Cell testId="display-name-cell" style={styles.stickyCell}>
                                    <TextLink
                                      href={getEntryUrl(entry)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      testId="entry-link"
                                      icon={<ExternalLinkIcon />}
                                      alignIcon="end">
                                      {getEntryTitle(entry, fields, selectedContentType)}
                                    </TextLink>
                                  </Table.Cell>
                                )}
                                <Table.Cell testId="status-cell" style={styles.cell}>
                                  <Badge variant={status.color}>{status.label}</Badge>
                                </Table.Cell>
                                {fields.map((field) => (
                                  <Table.Cell key={field.id} style={styles.cell}>
                                    {renderFieldValue(field, entry.fields[field.id]?.[LOCALE])}
                                  </Table.Cell>
                                ))}
                              </Table.Row>
                            );
                          })}
                        </Table.Body>
                      </Table>
                      <Box marginTop="spacingM">
                        <Pagination
                          activePage={activePage}
                          onPageChange={setActivePage}
                          totalItems={totalEntries}
                          showViewPerPage
                          viewPerPageOptions={PAGE_SIZE_OPTIONS}
                          itemsPerPage={itemsPerPage}
                          onViewPerPageChange={setItemsPerPage}
                          aria-label="Pagination navigation"
                        />
                      </Box>
                    </>
                  )}
                </>
              )}
            </Box>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
};

export default Page;
