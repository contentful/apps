import { FieldAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import { Document } from '@contentful/rich-text-types';
import { EntrySys } from '@contentful/app-sdk/dist/types/utils';
import { convertToSerializableJson, ErrorInfo } from '../utils';
import { ReleaseEntrySys } from '@contentful/app-sdk/dist/types/entry.types';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [fieldValue, setFieldValue] = useState<Document | null>(null);
  const [entrySys, setEntrySys] = useState<EntrySys | ReleaseEntrySys | null>(null);

  useAutoResizer();

  useEffect(() => {
    setFieldValue(sdk.field.getValue());

    const detachValueChangeHandler = sdk.field.onValueChanged(async (value: Document) => {
      setFieldValue(value);
    });

    return detachValueChangeHandler;
  }, [sdk.field]);

  useEffect(() => {
    setEntrySys(sdk.entry.getSys());

    const detachValueChangeHandler = sdk.entry.onSysChanged(async (sys: EntrySys) => {
      setEntrySys(sys);
    });

    return detachValueChangeHandler;
  }, [sdk.entry]);

  const isChanged = (sys: EntrySys | ReleaseEntrySys) => {
    if ('fieldStatus' in sys && sys.fieldStatus) {
      const fieldStatus = sys.fieldStatus as Record<string, Record<string, string>>;
      return fieldStatus['*']?.[sdk.field.locale] === 'changed';
    }

    return false;
  };

  const onButtonClick = async (value: Document | null) => {
    let currentErrorInfo: ErrorInfo = { hasError: false };

    if (!value) {
      return;
    }

    let publishedField: Document | undefined;

    try {
      const publishedEntries = await sdk.cma.entry.getPublished({
        query: { 'sys.id': sdk.ids.entry },
      });
      const publishedEntry = publishedEntries.items[0];

      if (publishedEntry?.fields?.[sdk.field.id]) {
        const fieldData = publishedEntry.fields[sdk.field.id];
        publishedField = fieldData as Document;
      }
    } catch (error) {
      currentErrorInfo = {
        hasError: true,
        errorCode: '500',
        errorMessage: 'Error loading content',
      };
    }

    await sdk.dialogs.openCurrentApp({
      title: 'Version Comparison',
      width: currentErrorInfo.hasError ? 'small' : 'fullWidth',
      parameters: {
        currentField: convertToSerializableJson(value),
        publishedField: publishedField
          ? convertToSerializableJson(publishedField)[sdk.field.locale]
          : undefined,
        errorInfo: convertToSerializableJson(currentErrorInfo),
        locale: sdk.field.locale,
      },
    });
  };

  return (
    <>
      <RichTextEditor sdk={sdk} isInitiallyDisabled={false} />
      <Button
        testId="view-diff-button"
        variant="primary"
        size="small"
        style={{ marginTop: tokens.spacingM }}
        isFullWidth={true}
        isDisabled={!fieldValue || !entrySys || !isChanged(entrySys)}
        onClick={() => onButtonClick(fieldValue)}>
        View Diff
      </Button>
    </>
  );
};

export default Field;
