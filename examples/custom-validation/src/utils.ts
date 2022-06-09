import { EditorExtensionSDK, FieldExtensionSDK, SidebarExtensionSDK } from '@contentful/app-sdk';
import { EntryProps } from 'contentful-management';

type SDK = FieldExtensionSDK | SidebarExtensionSDK | EditorExtensionSDK;

export function getEntry(sdk: SDK): EntryProps {
  return {
    // @ts-expect-error
    sys: sdk.entry.getSys(),
    fields: Object.fromEntries(
      Object.values(sdk.entry.fields).map((field) => [field.id, field.getValue()])
    ),
    metadata: sdk.entry.getMetadata(),
  };
}

export function onEntryChanged(sdk: SDK, callback: () => void): () => void {
  const triggerCallback = () => callback();

  const subscriptions: (() => void)[] = [];

  subscriptions.push(sdk.entry.onSysChanged(triggerCallback));
  for (const field of Object.values(sdk.entry.fields)) {
    subscriptions.push(field.onValueChanged(triggerCallback));
  }
  subscriptions.push(sdk.entry.onMetadataChanged(triggerCallback));

  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
}
