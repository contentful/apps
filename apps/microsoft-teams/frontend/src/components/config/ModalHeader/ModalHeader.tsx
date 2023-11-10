import { Box, Flex, IconButton, Subheading } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { styles } from './ModalHeader.styles';

interface Props {
  title: string;
  onClose: () => void;
  icon?: JSX.Element;
}

const ModalHeader = (props: Props) => {
  const { title, onClose, icon } = props;

  return (
    <Flex
      data-test-id="dialog-header"
      justifyContent="space-between"
      alignItems="center"
      className={styles.header}>
      <Flex alignItems="center">
        {icon}
        <Subheading marginBottom="none" marginLeft="spacingXs">
          {title}
        </Subheading>
      </Flex>
      <Box>
        <IconButton
          variant="transparent"
          aria-label="Close dialog"
          icon={<CloseIcon />}
          onClick={onClose}
        />
      </Box>
    </Flex>
  );
};

export default ModalHeader;
