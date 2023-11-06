import { Button } from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';

interface Props {
  buttonCopy: string;
}

const AddButton = (props: Props) => {
  const { buttonCopy } = props;

  return (
    <Button startIcon={<PlusIcon />} variant="secondary">
      {buttonCopy}
    </Button>
  );
};

export default AddButton;
