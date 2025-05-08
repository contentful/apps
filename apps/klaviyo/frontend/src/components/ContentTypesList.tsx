import React from 'react';
import { Checkbox, Text, Stack, Box } from '@contentful/f36-components';

interface ContentTypesListProps {
  contentTypes: any[];
  selectedContentTypes: Record<string, boolean>;
  onContentTypeToggle: (contentTypeId: string) => void;
  isDisabled?: boolean;
}

export const ContentTypesList: React.FC<ContentTypesListProps> = ({
  contentTypes,
  selectedContentTypes,
  onContentTypeToggle,
  isDisabled = false,
}) => {
  if (!contentTypes.length) {
    return <Text>No content types found.</Text>;
  }

  return (
    <Stack spacing="spacingS" flexDirection="column">
      {contentTypes.map((contentType) => (
        <Box key={contentType.sys.id} marginBottom="spacingXs">
          <Checkbox
            id={`content-type-${contentType.sys.id}`}
            isChecked={!!selectedContentTypes[contentType.sys.id]}
            onChange={() => onContentTypeToggle(contentType.sys.id)}
            isDisabled={isDisabled}>
            <div>
              <Text fontWeight="fontWeightMedium">{contentType.name}</Text>
              <Text fontColor="gray500">ID: {contentType.sys.id}</Text>
            </div>
          </Checkbox>
        </Box>
      ))}
    </Stack>
  );
};
