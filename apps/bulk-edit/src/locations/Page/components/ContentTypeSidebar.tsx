import React from 'react';
import { Box, Text, Flex } from '@contentful/f36-components';
import { NavList } from '@contentful/f36-navlist';
import { ContentTypeProps } from 'contentful-management';
import { styles } from '../styles';

interface ContentTypeSidebarProps {
  contentTypes: ContentTypeProps[];
  selectedContentTypeId: string | undefined;
  onContentTypeSelect: (id: string) => void;
}

export const ContentTypeSidebar: React.FC<ContentTypeSidebarProps> = ({
  contentTypes,
  selectedContentTypeId,
  onContentTypeSelect,
}) => {
  return (
    <Flex style={styles.sidebar} padding="spacingM" flexDirection="column" gap="spacingXs">
      <Text fontColor="gray600">Content types</Text>
      <NavList aria-label="Content types" testId="content-types-nav">
        {contentTypes.map((ct) => (
          <NavList.Item
            as="button"
            key={ct.sys.id}
            isActive={ct.sys.id === selectedContentTypeId}
            onClick={() => onContentTypeSelect(ct.sys.id)}
            testId="content-type-nav-item">
            {ct.name}
          </NavList.Item>
        ))}
      </NavList>
    </Flex>
  );
};
