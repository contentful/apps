import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Flex,
  FormControl,
  Text,
} from '@contentful/f36-components';
import AddButton from '@components/config/AddButton/AddButton';
import ContentfulLogo from '@components/config/ContentfulLogo/ContentfulLogo';
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
            <Text marginLeft="spacingXs" marginBottom="none" fontWeight="fontWeightMedium">
              {contentTypeSection.title}
            </Text>
          </Flex>
          <AddButton
            buttonCopy={contentTypeSection.addButton}
            // TODO: update this button to launch the content type selection modal
            handleClick={() => console.log('click')}
          />
        </Box>
        <Box marginBottom="spacingL">
          <Flex marginBottom="spacingS">
            <TeamsLogo />
            <Text marginLeft="spacingXs" marginBottom="none" fontWeight="fontWeightMedium">
              {channelSection.title}
            </Text>
          </Flex>
          <AddButton
            buttonCopy={channelSection.addButton}
            // TODO: update this button to launch the channel selection modal
            handleClick={() => console.log('click')}
          />
        </Box>
        <Box>
          <FormControl as="fieldset">
            <FormControl.Label>{actionsSection.title}</FormControl.Label>
            <Checkbox.Group name="checkbox-options">
              {Object.values(actionsSection.options).map((event) => (
                <Checkbox
                  key={event.id}
                  id={`event-${event.id}-${index}`}
                  value={`event-${event.id}-${index}`}>
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
