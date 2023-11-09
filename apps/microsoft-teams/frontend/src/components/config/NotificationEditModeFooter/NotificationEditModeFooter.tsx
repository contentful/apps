import { Box, Button, ButtonGroup, Flex } from '@contentful/f36-components';
import { styles } from './NotificationEditModeFooter.styles';
import { editModeFooter } from '@constants/configCopy';

interface Props {
  handleDelete: () => void;
  handleSave: () => void;
}

const NotificationEditModeFooter = (props: Props) => {
  const { handleDelete, handleSave } = props;

  return (
    <Box className={styles.footer}>
      <Flex justifyContent="flex-end" margin="spacingS">
        <ButtonGroup variant="spaced" spacing="spacingS">
          <Button variant="transparent">{editModeFooter.test}</Button>
          {/* TODO: implement modal to confirm deletion */}
          <Button variant="negative" onClick={handleDelete}>
            {editModeFooter.delete}
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editModeFooter.save}
          </Button>
        </ButtonGroup>
      </Flex>
    </Box>
  );
};

export default NotificationEditModeFooter;
