import { MouseEvent } from 'react';
import { Button } from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';

interface Props {
  buttonCopy: string;
  handleClick: (e: MouseEvent<HTMLButtonElement>) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

const AddButton = (props: Props) => {
  const { buttonCopy, handleClick, isDisabled = false, isLoading = false } = props;

  return (
    <Button
      startIcon={<PlusIcon />}
      variant="secondary"
      onClick={handleClick}
      isDisabled={isDisabled}
      isLoading={isLoading}>
      {buttonCopy}
    </Button>
  );
};

export default AddButton;
