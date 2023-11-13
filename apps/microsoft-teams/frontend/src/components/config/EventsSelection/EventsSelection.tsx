import { useMemo } from 'react';
import { Box, Checkbox, FormControl } from '@contentful/f36-components';
import { Notification } from '@customTypes/configPage';
import { AppEventKey, eventsSelection } from '@constants/configCopy';

interface Props {
  notification: Notification;
  handleNotificationEdit: (notificationEdit: Partial<Notification>) => void;
}

const EventsSelection = (props: Props) => {
  const { notification, handleNotificationEdit } = props;

  // For Checkbox.Group, creates an array of the values of the checkboxes that should be checked
  const selectedEventsArray = useMemo(
    () =>
      Object.values(AppEventKey).reduce((acc: string[], event) => {
        if (!notification.selectedEvents[event]) {
          return acc;
        }
        return [...acc, event];
      }, []),
    [notification.selectedEvents]
  );

  return (
    <Box>
      <FormControl as="fieldset">
        <FormControl.Label>{eventsSelection.title}</FormControl.Label>
        <Checkbox.Group
          name="events-options"
          onChange={(e) =>
            handleNotificationEdit({
              selectedEvents: {
                ...notification.selectedEvents,
                [e.target.value]: !notification.selectedEvents[e.target.value as AppEventKey],
              },
            })
          }
          value={selectedEventsArray}>
          {Object.values(eventsSelection.options).map((event) => (
            <Checkbox key={event.id} id={event.id} value={event.id}>
              {event.text}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </FormControl>
    </Box>
  );
};

export default EventsSelection;
