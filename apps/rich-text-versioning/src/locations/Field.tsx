import { FieldAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState, useMemo } from 'react';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import { Document } from '@contentful/rich-text-types';
import { EntrySys } from '@contentful/app-sdk/dist/types/utils';
import { createClient } from 'contentful';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [fieldValue, setFieldValue] = useState<Document | null>(null);
  const [entrySys, setEntrySys] = useState<EntrySys | null>(null);

  const client = useMemo(() => {
    try {
      const accessToken = sdk.parameters.installation?.contentfulApiKey;
      if (!accessToken) {
        console.error('Access token not found in app installation parameters');
        return null;
      }

      return createClient({
        space: sdk.ids.space,
        environment: sdk.ids.environment,
        accessToken: accessToken,
      });
    } catch (error) {
      console.error('Error creating CDA client:', error);
      return null;
    }
  }, [sdk.ids.space, sdk.ids.environment, sdk.parameters]);

  useAutoResizer();

  useEffect(() => {
    try {
      setFieldValue(sdk.field.getValue());
      setEntrySys(sdk.entry.getSys());
    } catch (error) {
      console.error('Error fetching field value:', error);
    }
  }, []);

  const isChanged = (sys: EntrySys) => {
    return !!sys?.publishedVersion && sys?.version >= sys?.publishedVersion + 2;
  };

  const onButtonClick = async (value: Document) => {
    let publishedField: Document | undefined;

    try {
      if (!client) {
        console.error('CDA client not available');
        return;
      }

      const publishedEntry = await client.getEntry(sdk.ids.entry);

      if (publishedEntry?.fields?.[sdk.field.id]) {
        const fieldData = publishedEntry.fields[sdk.field.id];
        publishedField = fieldData as Document;
      }
    } catch (error) {
      console.error('Error fetching published entry:', error);
    }

    await sdk.dialogs.openCurrentApp({
      title: 'Version Comparison',
      width: 1200,
      minHeight: 500,
      parameters: {
        currentField: JSON.parse(JSON.stringify(value)),
        publishedField: publishedField ? JSON.parse(JSON.stringify(publishedField)) : undefined,
      },
    });
  };

  return (
    <>
      <RichTextEditor sdk={sdk} isInitiallyDisabled={false} />
      {fieldValue && entrySys && (
        <Button
          variant="primary"
          size="small"
          style={{ marginTop: tokens.spacingM }}
          isFullWidth={true}
          isDisabled={!isChanged(entrySys)}
          onClick={() => onButtonClick(fieldValue)}>
          View Diff
        </Button>
      )}
    </>
  );
};

export default Field;
