import { FieldExtensionSDK } from '@contentful/app-sdk';
import { Note, Stack } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { getEntry, onEntryChanged } from '../utils';

export function Field() {
  const sdk = useSDK<FieldExtensionSDK>();

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    sdk.window.startAutoResizer();
    return () => sdk.window.stopAutoResizer();
  }, []);

  useEffect(() => {
    return onEntryChanged(sdk, () => {
      const entry = getEntry(sdk);
      const newErrors: string[] = [];

      if ((entry.fields.slug ?? '').startsWith(`${entry.fields.date}-`)) {
        sdk.entry.fields['slug'].getForLocale(sdk.locales.default).setInvalid(false);
      } else {
        sdk.entry.fields['slug'].getForLocale(sdk.locales.default).setInvalid(true);
        newErrors.push(`Slug must start with "${entry.fields.date}-"`);
      }

      setErrors(newErrors);
      sdk.field.setValue(newErrors.length === 0 ? 'true' : 'false');
    });
  }, [sdk]);

  return (
    <Stack flexDirection="column" alignItems="flex-start">
      {errors.length === 0 && <Note variant="positive">Entry is valid</Note>}

      {errors.map((error, index) => (
        <Note key={index} variant="negative">
          {error}
        </Note>
      ))}
    </Stack>
  );
}
