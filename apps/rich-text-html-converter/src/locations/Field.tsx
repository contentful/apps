import { FieldAppSDK } from '@contentful/app-sdk';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { EMPTY_DOCUMENT } from '@contentful/rich-text-types';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useMemo } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import { htmlToRichText } from '../utils/htmlToRichText';

const EMPTY_PARA = '<p></p>';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  // Convert the stored Contentful Document to HTML once on mount.
  const initialHtml = useMemo(() => {
    const value = sdk.field.getValue();
    if (!value) return '';
    try {
      return documentToHtmlString(value);
    } catch {
      return '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  const handleChange = useCallback(
    async (html: string) => {
      if (!html || html === EMPTY_PARA) {
        await sdk.field.setValue(EMPTY_DOCUMENT);
        return;
      }
      const doc = htmlToRichText(html);
      await sdk.field.setValue(doc);
    },
    [sdk.field],
  );

  return (
    <RichTextEditor initialHtml={initialHtml} onChange={handleChange} />
  );
};

export default Field;
