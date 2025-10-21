import { Notification } from '@contentful/f36-components';
import { formatValueForDisplay } from './entryUtils';

export interface SuccessNotificationParams {
  firstUpdatedValue: unknown;
  value: unknown;
  count: number;
  onUndo: (formattedFirstValue: string) => void;
}

export function successNotification({
  firstUpdatedValue,
  value,
  count,
  onUndo,
}: SuccessNotificationParams) {
  const formattedFirstValue = formatValueForDisplay(firstUpdatedValue, 30);
  const formattedNewValue = formatValueForDisplay(value, 30);

  const message =
    count === 1
      ? `${formattedFirstValue} was updated to ${formattedNewValue}`
      : `${formattedFirstValue} and ${
          count - 1
        } more entry fields were updated to ${formattedNewValue}`;

  const notification = Notification.success(message, {
    title: 'Success!',
    cta: {
      label: 'Undo',
      textLinkProps: {
        variant: 'primary',
        onClick: () => {
          notification.then((item) => {
            Notification.close(item.id);
            onUndo(formattedFirstValue);
          });
        },
      },
    },
  });
}
