import React, { useState, useEffect } from 'react';
import { css } from '@emotion/react';

import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import { Flex, Button } from '@contentful/f36-components';
import { ShoppingCartIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

import logo from '../../Salesforce_Corporate_Logo_RGB.png';
import { DialogInvocationParameters } from '../../locations/Dialog';
import { SfccItem, makeSelectText } from '../../utils/resources';
import { useFieldItems } from '../../utils/useFieldItems';

const logoStyle = css`
  display: block;
  width: 70px;
  height: 50px;
  margin-right: ${tokens.spacingM};
`;

const SelectItemAction = (props: { fieldValue?: string | string[] }) => {
  const sdk = useSDK<FieldAppSDK>();
  const selectMultiple = sdk.field.type === 'Array';
  const [currentData, setCurrentData] = useState<SfccItem[]>([]);

  const queryArray: string[] = [];
  if (props.fieldValue) {
    props.fieldValue instanceof Array
      ? queryArray.push(...props.fieldValue)
      : queryArray.push(props.fieldValue);
  }

  const { fieldType, options, locale, queries: currentItemQueries } = useFieldItems(queryArray);

  const queriesComplete = currentItemQueries.every((query) => query.isSuccess || query.isError);

  useEffect(() => {
    if (queriesComplete) {
      const updatedData: SfccItem[] = [];
      for (const query of currentItemQueries) {
        if (query.isSuccess) {
          updatedData.push(query.data);
        }
      }

      if (updatedData.length) {
        setCurrentData(updatedData);
      }
    }
  }, [queriesComplete]);

  const onButtonClick = async () => {
    const parameters: DialogInvocationParameters = {
      selectMultiple: selectMultiple,
      fieldType: fieldType,
      currentData: currentData,
      fieldValue: props.fieldValue,
      locale,
      ...options,
    };

    if (!queryArray.length || queriesComplete) {
      const result = await sdk.dialogs.openCurrent({
        width: 1400,
        shouldCloseOnOverlayClick: true,
        parameters,
      });
      if (result?.length) {
        sdk.field.setValue(result);
      }
    }
  };

  return (
    <Flex marginTop="spacingS">
      <img src={logo} alt="Salesforce Logo" css={logoStyle} />
      <Button
        startIcon={<ShoppingCartIcon />}
        variant="secondary"
        size="small"
        onClick={onButtonClick}>
        {makeSelectText(selectMultiple, fieldType)}
      </Button>
    </Flex>
  );
};

export default SelectItemAction;
