import { Notification } from '@contentful/f36-components';
import { getFieldDisplayValue } from './entryUtils';
import { ContentTypeField } from '../types';

export interface SuccessNotificationParams {
  firstUpdatedValue: unknown;
  value: unknown;
  count: number;
  field: ContentTypeField;
  onUndo: (formattedFirstValue: string) => void;
}

export function successNotification({
  firstUpdatedValue,
  value,
  count,
  field,
  onUndo,
}: SuccessNotificationParams) {
  const formattedFirstValue = getFieldDisplayValue(field, firstUpdatedValue);
  const formattedNewValue = getFieldDisplayValue(field, value);

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
