import { Button, Text } from '@contentful/f36-components';
import { css } from 'emotion';
import { PlusIcon } from '@contentful/f36-icons';
import { useContext } from 'react';
import ResourceFieldContext from 'context/ResourceFieldContext';
import tokens from '@contentful/f36-tokens';

const container = css({
  display: 'flex',
  border: `1px dashed ${tokens.gray500}`,
  borderRadius: tokens.borderRadiusMedium,
  justifyContent: 'center',
  padding: tokens.spacingXl,
});

export const AddContentButton = () => {
  const { handleAddContent } = useContext(ResourceFieldContext);

  return (
    <div className={container}>
      <Button
        variant="secondary"
        startIcon={<PlusIcon />}
        size="small"
        onClick={() => handleAddContent()}>
        <Text fontWeight="fontWeightDemiBold">Add content</Text>
      </Button>
    </div>
  );
};
