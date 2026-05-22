import { FieldAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Note,
  Paragraph,
  Text,
  TextLink,
} from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useMemo, useState } from 'react';
import type { AppInstallationParameters, PrimaryAsanaTaskLinkValue } from '../types';
import { buildPrimaryTaskLinkFromEntryValues, getPrimaryTaskLinkMapping } from '../utils/primaryTaskLink';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();

  const installationParameters = sdk.parameters.installation as AppInstallationParameters;
  const contentTypeFields = sdk.contentType.fields.map((field) => ({
    id: field.id,
    name: field.name,
    type: field.type,
  }));
  const mapping = getPrimaryTaskLinkMapping(
    installationParameters,
    sdk.contentType.sys.id,
    contentTypeFields
  );
  const [fieldValue, setFieldValue] = useState<PrimaryAsanaTaskLinkValue | string | undefined>(
    sdk.field.getValue() as PrimaryAsanaTaskLinkValue | string | undefined
  );

  useEffect(() => {
    setFieldValue(sdk.field.getValue() as PrimaryAsanaTaskLinkValue | string | undefined);

    const detachValueListener = sdk.field.onValueChanged((value) => {
      setFieldValue(value as PrimaryAsanaTaskLinkValue | string | undefined);
    });

    return () => {
      detachValueListener?.();
    };
  }, [sdk.field]);
  const taskLink = useMemo(() => {
    if (!mapping) {
      return null;
    }

    const fallbackValues = {
      ...(mapping.objectFieldId ? { [mapping.objectFieldId]: fieldValue } : {}),
      ...(mapping.taskGidFieldId
        ? { [mapping.taskGidFieldId]: sdk.entry.fields[mapping.taskGidFieldId]?.getValue() }
        : {}),
      ...(mapping.taskUrlFieldId
        ? { [mapping.taskUrlFieldId]: sdk.entry.fields[mapping.taskUrlFieldId]?.getValue() }
        : {}),
      ...(mapping.taskNameFieldId
        ? { [mapping.taskNameFieldId]: sdk.entry.fields[mapping.taskNameFieldId]?.getValue() }
        : {}),
    };

    return buildPrimaryTaskLinkFromEntryValues(fallbackValues, mapping);
  }, [fieldValue, mapping, sdk.entry.fields]);

  const fieldRole = useMemo(() => {
    if (!mapping) {
      return null;
    }

    if (mapping.objectFieldId && sdk.ids.field === mapping.objectFieldId) {
      return 'Primary Asana Task';
    }

    if (sdk.ids.field === mapping.taskGidFieldId) {
      return 'Task GID';
    }

    if (sdk.ids.field === mapping.taskUrlFieldId) {
      return 'Task URL';
    }

    if (sdk.ids.field === mapping.taskNameFieldId) {
      return 'Task name';
    }

    return null;
  }, [mapping, sdk.ids.field]);

  if (!fieldRole) {
    return (
      <Note variant="warning">
        This field is not currently part of the configured primary Asana task link mapping.
      </Note>
    );
  }

  return (
    <Box style={{ width: '100%', textAlign: 'left' }}>
      {fieldRole === 'Primary Asana Task' ? (
        <>
          <Paragraph marginBottom="none">
            Managed by the Asana app. Use the Asana sidebar to view or edit the linked task.
          </Paragraph>
          {taskLink ? (
            <Box style={{ width: '100%', textAlign: 'left' }}>
              <Text as="div">{taskLink.taskName}</Text>
              <TextLink href={taskLink.taskUrl} target="_blank" rel="noreferrer">
                Open in Asana
              </TextLink>
            </Box>
          ) : (
            <Text fontColor="gray600">No primary Asana task linked yet.</Text>
          )}
        </>
      ) : (
        <>
          <Paragraph marginBottom="none">
            This field is managed by the Asana app and stores part of the primary task link for this
            entry.
          </Paragraph>
          {fieldRole === 'Task URL' && typeof fieldValue === 'string' && fieldValue.trim() ? (
            <TextLink href={fieldValue} target="_blank" rel="noreferrer">
              Open linked Asana task
            </TextLink>
          ) : null}
        </>
      )}
    </Box>
  );
};

export default Field;
