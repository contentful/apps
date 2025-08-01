import React, { useEffect, useState } from 'react';
import { Paragraph } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { RichTextEditor } from '@contentful/field-editor-rich-text';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  return (
    <>
      <RichTextEditor sdk={sdk} isInitiallyDisabled={false} />
      <Paragraph>Hello Entry Field Component (AppId: {sdk.ids.app})</Paragraph>
    </>
  );
};

export default Field;
