import { Button } from '@contentful/f36-components';

type CreateButtonProps = {
  isLoading: boolean;
  onClick: () => void;
  isDisabled?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  dataTestId?: string;
};

const CreateButton = ({
  isLoading,
  onClick,
  isDisabled = false,
  variant = 'primary',
  size = 'small',
  dataTestId,
}: CreateButtonProps) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      isDisabled={isDisabled || isLoading}
      isLoading={isLoading}
      data-testid={dataTestId}>
      {isLoading ? 'Creating' : 'Send to Braze'}
    </Button>
  );
};

export default CreateButton;
