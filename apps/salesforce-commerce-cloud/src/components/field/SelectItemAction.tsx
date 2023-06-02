import React, { useState, useEffect } from 'react';
import { css } from '@emotion/react';
import { useQueries } from '@tanstack/react-query';

import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import { Flex, Button } from '@contentful/f36-components';
import { ShoppingCartIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';

import { AppInstanceParameters } from '../../locations/Field'
import logo from '../../Salesforce_Corporate_Logo_RGB.png'
import { SfccClient } from '../../utils/Sfcc';
import { AppInstallationParameters } from '../../locations/ConfigScreen';
import { DialogInvocationParameters } from '../../locations/Dialog';

const logoStyle = css`
  display: block;
  width: 70px;
  height: 50px;
  margin-right: ${tokens.spacingM};
`;

const SelectItemAction = (props: { fieldValue?: string | string[] }) => {
  const sdk = useSDK<FieldAppSDK>();
  const selectMultiple = sdk.field.type === 'Array';
  const { fieldType } = sdk.parameters.instance as AppInstanceParameters;
  const installParameters = sdk.parameters.installation as AppInstallationParameters;
  const [currentData, setCurrentData] = useState<any[]>([]);

  const queryArray: string[] = [];
  if (props.fieldValue) {
    props.fieldValue instanceof Array
      ? queryArray.push(...props.fieldValue)
      : queryArray.push(props.fieldValue);
  }

  const client = new SfccClient(installParameters);
  const currentItemQueries = useQueries({
    queries: queryArray.map((id:string) => {
      // const [itemId, catalogId] = id.split(":")
      return {
        queryKey: ['itemInfo', id],
        queryFn: fieldType === 'product' ? 
                 () => client.fetchProduct(id) :
                 () => client.fetchCategory(id)
      }
    })
  });

  const queriesComplete = currentItemQueries.every((query) => query.isSuccess || query.isError);

  useEffect(() => {
    if (queriesComplete) {
      const updatedData: any[] = [];
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

  const makeCTAText = (selectMultiple: boolean, fieldType: string) => {
    let ctaText = 'Select ';
    if (selectMultiple) {
      ctaText += fieldType === 'product' ? 'products' : 'categories';
    } else {
      ctaText += `a ${fieldType}`;
    }

    return ctaText;
  };

  const onButtonClick = async () => {
    const parameters: DialogInvocationParameters = {
      selectMultiple: selectMultiple,
      fieldType: fieldType,
      currentData: currentData,
      fieldValue: props.fieldValue,
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
        {makeCTAText(selectMultiple, fieldType)}
      </Button>
    </Flex>
  );
};

export default SelectItemAction;
