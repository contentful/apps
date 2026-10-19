import React from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { KeyValueMap } from 'contentful-management';
import { /* useCMA, */ useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import { Modal } from '@contentful/f36-components';
import SearchPicker from '../components/dialog/SearchPicker';
import { FieldType, SfccItem, makeSelectText } from '../utils/resources';

export interface DialogInvocationParameters extends KeyValueMap {
  selectMultiple: boolean;
  fieldType: FieldType;
  fieldValue?: string | string[];
  currentData?: SfccItem[];
  locale?: string;
  siteId?: string;
  catalogId?: string;
  includeVariants?: boolean;
}

const Dialog = () => {
  useAutoResizer();
  const sdk = useSDK<DialogAppSDK>();

  const { selectMultiple, fieldType } = sdk.parameters.invocation as DialogInvocationParameters;

  return (
    <>
      <Modal.Header title={makeSelectText(selectMultiple, fieldType)} onClose={() => sdk.close()} />
      <SearchPicker />
    </>
  );
};

export default Dialog;
