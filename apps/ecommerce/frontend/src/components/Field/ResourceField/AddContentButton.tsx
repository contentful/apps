import { Box, Button, Flex, Text } from '@contentful/f36-components';
import { css } from 'emotion';
import { PlusIcon } from '@contentful/f36-icons';
import { useContext } from 'react';
import ResourceFieldContext from 'context/ResourceFieldContext';
import tokens from '@contentful/f36-tokens';

const container = css({
  border: `1px dashed ${tokens.gray500}`,
  borderRadius: tokens.borderRadiusMedium,
});

export const AddContentButton = () => {
  const { handleAddContent } = useContext(ResourceFieldContext);

  return (
    <Box marginBottom="spacingM">
      <Flex padding="spacingXl" fullWidth={true} justifyContent="center" className={container}>
        <Button
          variant="secondary"
          startIcon={<PlusIcon />}
          size="small"
          onClick={() => handleAddContent()}>
          <Text fontWeight="fontWeightDemiBold">Add content</Text>
        </Button>
      </Flex>
    </Box>
  );
};
