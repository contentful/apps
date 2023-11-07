import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Flex,
  FormControl,
  Paragraph,
} from '@contentful/f36-components';
import AddButton from '@components/config/AddButton/AddButton';
import ContentfulLogo from '../ContentfulLogo/ContentfulLogo';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { styles } from './NotificationEditMode.styles';
import {
  actionsSection,
  channelSection,
  contentTypeSection,
  editModeFooter,
} from '@constants/configCopy';

interface Props {
  index: number;
}

const NotificationEditMode = (props: Props) => {
  const { index } = props;

  return (
    <Box className={styles.wrapper}>
      <Box className={styles.main}>
        <Box marginBottom="spacingL">
          <Flex marginBottom="spacingS">
            <ContentfulLogo />
            <Paragraph marginLeft="spacingXs" marginBottom="none">
              {contentTypeSection.title}
            </Paragraph>
          </Flex>
          <AddButton
            buttonCopy={contentTypeSection.addButton}
            handleClick={() => console.log('click')}
          />
        </Box>
        <Box marginBottom="spacingL">
          <Flex marginBottom="spacingS">
            <TeamsLogo />
            <Paragraph marginLeft="spacingXs" marginBottom="none">
              {channelSection.title}
            </Paragraph>
          </Flex>
          <AddButton
            buttonCopy={channelSection.addButton}
            handleClick={() => console.log('click')}
          />
        </Box>
        <Box>
          <FormControl as="fieldset">
            <FormControl.Label as="legend">{actionsSection.title}</FormControl.Label>
            <Checkbox.Group name="checkbox-options">
              {Object.values(actionsSection.options).map((event) => (
                <Checkbox
                  key={event.id}
                  id={`event-${event.id}-${index}`}
                  value={`event-${event.id}-${index}`}
                  onChange={() => console.log('change')}>
                  {event.text}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </FormControl>
        </Box>
      </Box>
      <Box className={styles.footer}>
        <Flex justifyContent="flex-end" margin="spacingS">
          <ButtonGroup variant="spaced" spacing="spacingS">
            <Button variant="transparent">{editModeFooter.test}</Button>
            <Button variant="negative">{editModeFooter.delete}</Button>
            <Button variant="primary">{editModeFooter.save}</Button>
          </ButtonGroup>
        </Flex>
      </Box>
    </Box>
  );
};

export default NotificationEditMode;
