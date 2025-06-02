import React, { useEffect, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Box, Heading, Flex, Spinner } from '@contentful/f36-components';
import { NavList } from '@contentful/f36-navlist';

interface ContentType {
  sys: { id: string };
  name: string;
}

const Page = () => {
  const sdk = useSDK();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContentTypes = async () => {
      setLoading(true);
      try {
        const res = await sdk.cma.contentType.getMany({});
        const sorted = res.items
          .slice()
          .sort((a: ContentType, b: ContentType) => a.name.localeCompare(b.name));
        setContentTypes(sorted);
        if (sorted.length > 0) {
          setSelectedContentTypeId(sorted[0].sys.id);
        }
      } catch (e) {
        setContentTypes([]);
        setSelectedContentTypeId(undefined);
      } finally {
        setLoading(false);
      }
    };
    fetchContentTypes();
  }, [sdk]);

  const handleNavClick = (id: string) => {
    setSelectedContentTypeId(id);
  };

  const selectedContentType = contentTypes.find((ct) => ct.sys.id === selectedContentTypeId);

  return (
    <Flex>
      <Box
        style={{
          minWidth: 220,
          borderRight: '1px solid #e7ebee',
          background: '#f7f9fa',
          height: '100vh',
        }}
        padding="spacingL">
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
      </Box>
      <Box flexGrow={1} padding="spacingL">
        {loading ? (
          <Spinner />
        ) : (
          <Heading>
            {selectedContentType ? `Bulk edit ${selectedContentType.name}` : 'Bulk Edit App'}
          </Heading>
        )}
        {/* The rest of your page content (table, etc.) goes here */}
      </Box>
    </Flex>
  );
};

export default Page;
