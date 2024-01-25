import { Box, Button, ButtonGroup, Flex } from '@contentful/f36-components';
import { styles } from './NotificationEditModeFooter.styles';
import { editModeFooter } from '@constants/configCopy';

interface Props {
  handleTest: () => void;
  handleCancel: () => void;
  handleSave: () => void;
  isSaveDisabled: boolean;
  isTestSending: boolean;
}

const NotificationEditModeFooter = (props: Props) => {
  const { handleTest, handleCancel, handleSave, isSaveDisabled, isTestSending } = props;

  return (
    <Box className={styles.footer}>
      <Flex justifyContent="flex-end" margin="spacingS">
        <ButtonGroup variant="spaced" spacing="spacingS">
          <Button
            variant="transparent"
            onClick={handleTest}
            isLoading={isTestSending}
            isDisabled={isTestSending}>
            {editModeFooter.test}
          </Button>
          <Button variant="secondary" onClick={handleCancel}>
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
