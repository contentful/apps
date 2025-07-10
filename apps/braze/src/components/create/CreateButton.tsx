import { Button } from '@contentful/f36-components';

type CreateButtonProps = {
  isLoading: boolean;
  onClick: () => void;
  isDisabled?: boolean;
  size?: 'small' | 'medium' | 'large';
};

const CreateButton = ({
  isLoading,
  onClick,
  isDisabled = false,
  size = 'small',
}: CreateButtonProps) => {
  return (
    <Button
      variant={'primary'}
      size={size}
      onClick={onClick}
      isDisabled={isDisabled || isLoading}
      isLoading={isLoading}>
      {isLoading ? 'Creating' : 'Send to Braze'}
    </Button>
  );
};

export default CreateButton;
