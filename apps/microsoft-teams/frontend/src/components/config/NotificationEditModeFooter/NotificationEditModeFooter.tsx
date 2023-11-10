import { Box, Button, ButtonGroup, Flex } from '@contentful/f36-components';
import { styles } from './NotificationEditModeFooter.styles';
import { editModeFooter } from '@constants/configCopy';

interface Props {
  index: number;
  handleDelete: (index: number) => void;
}

const NotificationEditModeFooter = (props: Props) => {
  const { index, handleDelete } = props;

  return (
    <Box className={styles.footer}>
      <Flex justifyContent="flex-end" margin="spacingS">
        <ButtonGroup variant="spaced" spacing="spacingS">
          <Button variant="transparent">{editModeFooter.test}</Button>
          {/* TODO: implement modal to confirm deletion */}
          <Button variant="negative" onClick={() => handleDelete(index)}>
            {editModeFooter.delete}
          </Button>
          <Button variant="primary">{editModeFooter.save}</Button>
        </ButtonGroup>
      </Flex>
    </Box>
  );
};

export default NotificationEditModeFooter;
