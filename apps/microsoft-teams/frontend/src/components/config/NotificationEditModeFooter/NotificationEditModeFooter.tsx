import { Box, Button, ButtonGroup, Flex } from '@contentful/f36-components';
import { styles } from './NotificationEditModeFooter.styles';
import { editModeFooter } from '@constants/configCopy';

interface Props {
  handleCancel: () => void;
  isCancelDisabled: boolean;
  handleSave: () => void;
  isSaveDisabled: boolean;
}

const NotificationEditModeFooter = (props: Props) => {
  const { handleCancel, isCancelDisabled, handleSave, isSaveDisabled } = props;

  return (
    <Box className={styles.footer}>
      <Flex justifyContent="flex-end" margin="spacingS">
        <ButtonGroup variant="spaced" spacing="spacingS">
          <Button variant="transparent">{editModeFooter.test}</Button>
          <Button variant="secondary" onClick={handleCancel} isDisabled={isCancelDisabled}>
            {editModeFooter.cancel}
          </Button>
          <Button variant="primary" onClick={handleSave} isDisabled={isSaveDisabled}>
            {editModeFooter.save}
          </Button>
        </ButtonGroup>
      </Flex>
    </Box>
  );
};

export default NotificationEditModeFooter;
