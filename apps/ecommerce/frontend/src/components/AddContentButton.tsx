import { Button, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { PlusIcon } from '@contentful/f36-icons';
import { MouseEventHandler } from 'react';

interface AddContentButtonProps {
  onClick: MouseEventHandler;
}

const container = css({
  display: 'flex',
  border: `1px dashed ${tokens.gray500}`,
  borderRadius: tokens.borderRadiusMedium,
  justifyContent: 'center',
  padding: tokens.spacingXl,
});

export const AddContentButton = (props: AddContentButtonProps) => {
  const { onClick } = props;

  return (
    <div className={container}>
      <Button variant="secondary" startIcon={<PlusIcon />} size="small" onClick={onClick}>
        <Text fontWeight="fontWeightDemiBold">Add content</Text>
      </Button>
    </div>
  );
};
