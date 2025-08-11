import { FieldAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import { Document } from '@contentful/rich-text-types';
import { EntrySys } from '@contentful/app-sdk/dist/types/utils';
import { ErrorInfo } from '../utils';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [fieldValue, setFieldValue] = useState<Document | null>(null);
  const [entrySys, setEntrySys] = useState<EntrySys | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>({ hasError: false });

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

  const isChanged = (sys: EntrySys) => {
    return !!sys?.publishedVersion && sys?.version >= sys?.publishedVersion + 2;
  };

  const onButtonClick = async (value: Document | null) => {
    if (!value) {
      return;
    }

    let publishedField: Document | undefined;
    let currentErrorInfo = errorInfo;

    try {
      const publishedEntries = await sdk.cma.entry.getPublished({
        query: { 'sys.id': sdk.ids.entry },
      });
      const publishedEntry = publishedEntries.items[0];

      if (publishedEntry?.fields?.[sdk.field.id]) {
        const fieldData = publishedEntry.fields[sdk.field.id];
        publishedField = fieldData as Document;
      }

      setErrorInfo({ hasError: false });
    } catch (error: any) {
      switch (Object.values(error)[0]) {
        default:
          currentErrorInfo = {
            hasError: true,
            errorCode: '500',
            errorMessage: 'Error loading content',
          };
      }

      setErrorInfo(currentErrorInfo);
    }

    await sdk.dialogs.openCurrentApp({
      title: 'Version Comparison',
      width: 1200,
      minHeight: 500,
      parameters: {
        currentField: JSON.parse(JSON.stringify(value)),
        publishedField: publishedField
          ? JSON.parse(JSON.stringify(publishedField))[sdk.locales.default]
          : undefined,
        errorInfo: JSON.parse(JSON.stringify(currentErrorInfo)),
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
