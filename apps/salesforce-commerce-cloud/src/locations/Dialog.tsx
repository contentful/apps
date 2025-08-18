import React from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { KeyValueMap } from 'contentful-management';
import { /* useCMA, */ useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import { Modal, Flex } from '@contentful/f36-components';
import SearchPicker from '../components/dialog/SearchPicker';

export interface DialogInvocationParameters extends KeyValueMap {
  selectMultiple: boolean;
  fieldType: 'product' | 'category';
  fieldValue?: string | string[];
  currentData?: any | any[];
}

const Dialog = () => {
  useAutoResizer();
  const sdk = useSDK<DialogAppSDK>();

  const { selectMultiple, fieldType } = sdk.parameters.invocation as DialogInvocationParameters;

  const makeTitle = (selectMultiple: boolean, fieldType: string) => {
    let title = 'Select ';
    title += selectMultiple
      ? fieldType === 'product'
        ? 'products'
        : 'categories'
      : fieldType === 'product'
      ? 'a product'
      : 'a category';

    return title;
  };

  return (
    <>
      <Modal.Header title={makeTitle(selectMultiple, fieldType)} onClose={() => sdk.close()} />
      <SearchPicker />
    </>
  );
};

export default Dialog;
