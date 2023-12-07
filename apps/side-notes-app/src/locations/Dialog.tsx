import { DialogExtensionSDK } from '@contentful/app-sdk';
import { renderRichTextDialog } from '@contentful/field-editor-rich-text';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { renderMarkdownDialog } from '@contentful/field-editor-markdown';

const Dialog = () => {
  const sdk = useSDK<DialogExtensionSDK>();
  useAutoResizer();

  if (
    sdk.parameters.invocation &&
    typeof sdk.parameters.invocation === 'object' &&
    'type' in sdk.parameters.invocation &&
    typeof sdk.parameters.invocation.type === 'string'
  ) {
    if (sdk.parameters.invocation.type.startsWith('rich-text-')) {
      return renderRichTextDialog(sdk);
    } else if (sdk.parameters.invocation.type.startsWith('markdown-')) {
      // @ts-expect-error Types of `sdk.parameters.invocation` are quite unspecific
      return renderMarkdownDialog(sdk);
    }
  }

  return null;
};

export default Dialog;
