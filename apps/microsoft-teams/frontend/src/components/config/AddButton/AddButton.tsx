import { MouseEvent } from 'react';
import { Button } from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';

interface Props {
  buttonCopy: string;
  handleClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

const AddButton = (props: Props) => {
  const { buttonCopy, handleClick } = props;

  return (
    <Button startIcon={<PlusIcon />} variant="secondary" onClick={handleClick}>
      {buttonCopy}
    </Button>
  );
};

export default AddButton;
