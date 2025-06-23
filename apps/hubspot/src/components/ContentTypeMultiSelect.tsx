import React, { useCallback } from 'react';
import {
  Box,
  Stack,
  Pill,
  Autocomplete,
  Checkbox,
  Text,
  Subheading,
  Paragraph,
} from '@contentful/f36-components';
import { styles } from '../locations/ConfigScreen.styles';

export interface ContentType {
  id: string;
  name: string;
}

interface ContentTypeMultiSelectProps {
  selectedContentTypes: ContentType[];
  setSelectedContentTypes: (contentTypes: ContentType[]) => void;
  availableContentTypes: ContentType[];
}

const ContentTypeMultiSelect: React.FC<ContentTypeMultiSelectProps> = ({
  selectedContentTypes,
  setSelectedContentTypes,
  availableContentTypes,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleToggleContentType = useCallback(
    (contentType: ContentType) => {
      const isSelected = selectedContentTypes.some((ct) => ct.id === contentType.id);
      if (isSelected) {
        setSelectedContentTypes(selectedContentTypes.filter((ct) => ct.id !== contentType.id));
      } else {
        setSelectedContentTypes([...selectedContentTypes, contentType]);
      }
    },
    [selectedContentTypes, setSelectedContentTypes]
  );

  const getPlaceholderText = useCallback(() => {
    if (selectedContentTypes.length === 0) return 'Select one or more';
    if (selectedContentTypes.length === 1) return selectedContentTypes[0].name;
    return `${selectedContentTypes[0].name} and ${selectedContentTypes.length - 1} more`;
  }, [selectedContentTypes]);

  const isAllSelected = selectedContentTypes.length === availableContentTypes.length;

  return (
    <>
      <Subheading marginBottom="spacing2Xs">Assign content types</Subheading>
      <Paragraph marginBottom="spacingM">
        The Hubspot integration will be enabled for content types you assign, and the sidebar widget
        will show up on these entry pages.
      </Paragraph>
      <Text fontWeight="fontWeightDemiBold">Content types</Text>
      <Stack marginTop="spacingXs" flexDirection="column" alignItems="start">
        <Autocomplete
          items={availableContentTypes}
          placeholder={getPlaceholderText()}
          onSelectItem={() => null}
          isDisabled={isAllSelected}
          itemToString={(item) => item.name}
          renderItem={(item) => (
            <Box
              padding="spacingXs"
              width="full"
              onClick={() => handleToggleContentType(item)}
              className={styles.dropdownItem}>
              <Checkbox
                id={`checkbox-${item.id}`}
                isChecked={selectedContentTypes.some((ct) => ct.id === item.id)}
                onClick={() => {}}>
                {item.name}
              </Checkbox>
            </Box>
          )}
          textOnAfterSelect="clear"
          closeAfterSelect={false}
          listWidth="full"
          isOpen={isOpen}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          isReadOnly
        />

        {selectedContentTypes.length > 0 && (
          <Box width="full" overflow="auto">
            <Stack flexDirection="row" spacing="spacing2Xs" flexWrap="wrap">
              {selectedContentTypes.map((contentType, index) => (
                <Pill
                  key={index}
                  label={contentType.name}
                  isDraggable={false}
                  onClose={() => handleToggleContentType(contentType)}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </>
  );
};

export default ContentTypeMultiSelect;
