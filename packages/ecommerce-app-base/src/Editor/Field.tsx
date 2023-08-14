import { Button } from '@contentful/f36-components';
import { ShoppingCartIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import * as React from 'react';
import { FC, useCallback, useEffect, useState } from 'react';
import { FieldsSkuTypes } from '../AppConfig/fields';
import { SortableComponent } from './SortableComponent';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useIntegration } from './IntegrationContext';

const styles = {
  sortable: css({
    marginBottom: tokens.spacingM,
  }),
  container: css({
    display: 'flex',
  }),
  logo: css({
    display: 'block',
    width: '30px',
    height: '30px',
    marginRight: tokens.spacingM,
  }),
};

function fieldValueToState(value?: string | string[]): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

const Field: FC = () => {
  useAutoResizer();

  const sdk = useSDK<FieldAppSDK>();

  const { skuTypes, fetchProductPreviews, logo, isDisabled, makeCTA, openDialog } =
    useIntegration();

  // Do we need a local representation of the remote state?
  const [value, setValue] = useState(() => fieldValueToState(sdk.field.getValue()));
  const [editingDisabled, setEditingDisabled] = useState(() => false);

  useEffect(() => {
    sdk.field.onValueChanged((value?: string[] | string) => {
      setValue(fieldValueToState(value));
    });
  }, [setValue, sdk.field]);

  useEffect(() => {
    sdk.field.onIsDisabledChanged((editingDisabled: boolean) => {
      setEditingDisabled(editingDisabled);
    });
  }, [sdk.field]);

  const updateValue = useCallback(
    async (skus: string[]) => {
      if (skus.length > 0) {
        const value = sdk.field.type === 'Array' ? skus : skus[0];
        await sdk.field.setValue(value);
      } else {
        await sdk.field.removeValue();
      }
    },
    [sdk.field]
  );

  // useCallback relevant?
  const onDialogOpen = useCallback(async () => {
    const currentValue = value;
    const config = sdk.parameters.installation;

    const defaultSkuType = skuTypes?.find((skuType) => skuType.default === true)?.id;
    const skuType =
      (config as { skuTypes?: FieldsSkuTypes }).skuTypes?.[sdk.contentType.sys.id]?.[
        sdk.field.id
      ] ?? defaultSkuType;

    const result = await openDialog(sdk, currentValue, {
      ...config,
      fieldValue: fieldValueToState(sdk.field.getValue()),
      fieldType: sdk.field.type,
      skuType,
    });

    if (result.length) {
      await updateValue(result);
    }
  }, [value, sdk, openDialog, skuTypes, updateValue]);

  const hasItems = value.length > 0;
  const config = sdk.parameters.installation;
  const isDisabledLocal = editingDisabled || isDisabled(value, config);

  const defaultSkuType = skuTypes?.find((skuType) => skuType.default === true)?.id;

  const skuType =
    (config as { skuTypes?: FieldsSkuTypes }).skuTypes?.[sdk.contentType.sys.id]?.[sdk.field.id] ??
    defaultSkuType;

  return (
    <>
      {hasItems && (
        <div className={styles.sortable}>
          <SortableComponent
            sdk={sdk}
            disabled={editingDisabled}
            skus={value}
            onChange={updateValue}
            config={config}
            fetchProductPreviews={fetchProductPreviews}
            skuType={skuType}
          />
        </div>
      )}
      <div className={styles.container}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <Button
          startIcon={<ShoppingCartIcon />}
          variant="secondary"
          size="small"
          onClick={onDialogOpen}
          isDisabled={isDisabledLocal}>
          {makeCTA(sdk.field.type, skuType)}
        </Button>
      </div>
    </>
  );
};

export default Field;
