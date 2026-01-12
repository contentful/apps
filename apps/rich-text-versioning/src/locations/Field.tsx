import { FieldAppSDK } from '@contentful/app-sdk';
import { Button, Tooltip } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import { Document } from '@contentful/rich-text-types';
import { EntrySys } from '@contentful/app-sdk/dist/types/utils';
import { convertToSerializableJson, ErrorInfo } from '../utils';
import { ReleaseEntrySys } from '@contentful/app-sdk/dist/types/entry.types';
import { styles } from './Field.styles';
import { i18n } from '@lingui/core';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [fieldValue, setFieldValue] = useState<Document | null>(null);
  const [entrySys, setEntrySys] = useState<EntrySys | ReleaseEntrySys | null>(null);

  useAutoResizer();

  const locale = sdk.field.locale;
  if (!i18n.locale) {
    i18n.load(locale, {});
    i18n.activate(locale);
  }

  useEffect(() => {
    setFieldValue(sdk.field.getValue());

    const detachValueChangeHandler = sdk.field.onValueChanged(async (value: Document) => {
      setFieldValue(value);
      sdk.entry.save();
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
        query: {
          'sys.id': sdk.ids.entry,
          include: 0,
        },
      });
      const publishedEntry = publishedEntries.items[0];

      publishedField = publishedEntry?.fields?.[sdk.field.id]?.[sdk.field.locale];
    } catch (error) {
      console.error('Error loading content:', error);
      currentErrorInfo = {
        hasError: true,
        errorCode: '500',
        errorMessage: 'Error loading content',
      };
    }

    await sdk.dialogs.openCurrentApp({
      title: 'Version comparison',
      width: currentErrorInfo.hasError ? 'small' : 'fullWidth',
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: {
        currentField: convertToSerializableJson(value),
        publishedField: publishedField ? convertToSerializableJson(publishedField) : undefined,
        errorInfo: convertToSerializableJson(currentErrorInfo),
        locale: sdk.field.locale,
      },
    });
  };

  const isDisabled = !fieldValue || !entrySys || !isChanged(entrySys);

  return (
    <>
      <div className={styles.richTextEditorContainer}>
        <RichTextEditor sdk={sdk} isInitiallyDisabled={false} />
      </div>
      <Tooltip
        placement="top"
        content={
          isDisabled
            ? 'Versions can be viewed once the entry is published with content and changes are made to the field.'
            : ''
        }>
        <Button
          testId="view-diff-button"
          variant="secondary"
          size="small"
          style={{ marginTop: tokens.spacingXs }}
          isDisabled={isDisabled}
          onClick={() => onButtonClick(fieldValue)}>
          Compare versions
        </Button>
      </Tooltip>
    </>
  );
};

export default Field;
