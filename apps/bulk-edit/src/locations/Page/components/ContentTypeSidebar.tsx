import React from 'react';
import { Text, Flex } from '@contentful/f36-components';
import { NavList } from '@contentful/f36-navlist';
import { ContentTypeProps } from 'contentful-management';
import { styles } from './ContentTypeSidebar.styles';

interface ContentTypeSidebarProps {
  contentTypes: ContentTypeProps[];
  selectedContentTypeId: string | undefined;
  onContentTypeSelect: (id: string) => void;
  disabled?: boolean;
}

export const ContentTypeSidebar: React.FC<ContentTypeSidebarProps> = ({
  contentTypes,
  selectedContentTypeId,
  onContentTypeSelect,
  disabled = false,
}) => {
  return (
    <Flex style={styles.sidebar}>
      <Text style={styles.sidebarTitle}>Content types</Text>
      <div style={styles.sidebarContent}>
        <div style={styles.sidebarList}>
          <NavList aria-label="Content types" testId="content-types-nav">
            {contentTypes.length === 0 ? (
              <Text style={styles.noContentTypeText}>No content types found.</Text>
            ) : (
              contentTypes.map((ct) => (
                <NavList.Item
                  as="button"
                  key={ct.sys.id}
                  isActive={ct.sys.id === selectedContentTypeId}
                  onClick={disabled ? undefined : () => onContentTypeSelect(ct.sys.id)}
                  isDisabled={disabled}
                  testId="content-type-nav-item">
                  {ct.name}
                </NavList.Item>
              ))
            )}
          </NavList>
        </div>
      </div>
    </Flex>
  );
};
