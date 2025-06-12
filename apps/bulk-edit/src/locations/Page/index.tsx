import { useEffect, useState } from 'react';
import { Box, Heading, Flex, Spinner } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentFields, ContentTypeProps, KeyValueMap } from 'contentful-management';
import { Entry, ContentTypeField } from './types';
import { styles } from './styles';
import { ContentTypeSidebar } from './components/ContentTypeSidebar';
import { SortMenu, SORT_OPTIONS } from './components/SortMenu';
import { EntryTable } from './components/EntryTable';

const PAGE_SIZE_OPTIONS = [15, 50, 100];

const Page = () => {
  const sdk = useSDK();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string | undefined>(undefined);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [fields, setFields] = useState<ContentTypeField[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0].value);
  const locales = sdk.locales.available;
  const defaultLocale = sdk.locales.default;

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

  const buildQuery = (sortOption: string, displayField: string) => {
    const getOrder = (sortOption: string) => {
      if (sortOption === 'displayName_asc') return `fields.${displayField}`;
      else if (sortOption === 'displayName_desc') return `-fields.${displayField}`;
      else if (sortOption === 'updatedAt_desc') return '-sys.updatedAt';
      else if (sortOption === 'updatedAt_asc') return 'sys.updatedAt';
    };

    return {
      content_type: selectedContentTypeId,
      skip: activePage * itemsPerPage,
      limit: itemsPerPage,
      order: getOrder(sortOption),
    };
  };

  useEffect(() => {
    const fetchContentTypes = async (): Promise<void> => {
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
      }
    };
    void fetchContentTypes();
  }, [sdk]);

  useEffect(() => {
    setActivePage(0);
  }, [selectedContentTypeId, sortOption]);

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
        const newFields: ContentTypeField[] = [];
        ct.fields.forEach((f: ContentFields<KeyValueMap>) => {
          if (f.localized) {
            locales.forEach((locale) => {
              newFields.push({
                id: f.id,
                uniqueId: `${f.id}-${locale}`,
                name: f.name,
                type: f.type as any,
                locale: locale,
              });
            });
          } else {
            newFields.push({
              id: f.id,
              uniqueId: f.id,
              name: f.name,
              type: f.type as any,
            });
          }
        });
        setFields(newFields);
        const displayField = ct.displayField || 'displayName';

        const { items, total } = await sdk.cma.entry.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          query: buildQuery(sortOption, displayField),
        });
        setEntries(items || []);
        setTotalEntries(total || 0);
      } catch (e) {
        setEntries([]);
        setFields([]);
        setTotalEntries(0);
      } finally {
        setEntriesLoading(false);
      }
    };
    void fetchFieldsAndEntries();
  }, [sdk, selectedContentTypeId, activePage, itemsPerPage, sortOption]);

  const selectedContentType = contentTypes.find((ct) => ct.sys.id === selectedContentTypeId);

  return (
    <Flex>
      <Box style={styles.mainContent} padding="spacingL">
        <Box style={styles.whiteBox} paddingTop="spacingL">
          <Flex>
            <ContentTypeSidebar
              contentTypes={contentTypes}
              selectedContentTypeId={selectedContentTypeId}
              onContentTypeSelect={setSelectedContentTypeId}
            />
            <div style={styles.stickySpacer} />
            <Box>
              <>
                <Heading style={styles.stickyPageHeader}>
                  {selectedContentType ? `Bulk edit ${selectedContentType.name}` : 'Bulk Edit App'}
                </Heading>
                {(entries.length === 0 && !entriesLoading) || !selectedContentType ? (
                  <Box style={styles.noEntriesText}>No entries found.</Box>
                ) : (
                  <>
                    {entriesLoading ? (
                      <Spinner />
                    ) : (
                      <>
                        <SortMenu sortOption={sortOption} onSortChange={setSortOption} />
                        <EntryTable
                          entries={entries}
                          fields={fields}
                          contentType={selectedContentType}
                          spaceId={sdk.ids.space}
                          environmentId={sdk.ids.environment}
                          defaultLocale={defaultLocale}
                          activePage={activePage}
                          totalEntries={totalEntries}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setActivePage}
                          onItemsPerPageChange={setItemsPerPage}
                          pageSizeOptions={PAGE_SIZE_OPTIONS}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
};

export default Page;
