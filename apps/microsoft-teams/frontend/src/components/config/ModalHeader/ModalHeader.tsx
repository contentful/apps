import { Box, Flex, IconButton, Subheading } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { styles } from './ModalHeader.styles';

interface Props {
  title: string;
  onClose: () => void;
}

const ModalHeader = (props: Props) => {
  const { title, onClose } = props;

  return (
    <Flex
      data-test-id="dialog-header"
      justifyContent="space-between"
      alignItems="center"
      className={styles.header}>
      <Flex alignItems="center">
        <TeamsLogo />
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
