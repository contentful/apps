import React, { useEffect, useState } from 'react';
import { IconButton } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import get from 'lodash/get';
import { SortableComponent } from '@components/ProductPreviews/SortableComponent';
import logo from '../../logo.png';
import { AppParameters, SAPParameters } from '@interfaces';
import { styles } from '@components/Field/Field.styles';
import { ShoppingCartIcon } from '@contentful/f36-icons';
import useAPI from '@hooks/useAPI';

interface Props {
  sdk: FieldAppSDK<AppParameters>;
}

function fieldValueToState(value?: string | string[]): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function makeCTAText(fieldType: string) {
  const isArray = fieldType === 'Array';
  const beingSelected = isArray ? 'products' : 'a product';
  return `Select ${beingSelected}`;
}

export default function Field({ sdk }: Props) {
  const [value, setValue] = useState<string[]>(fieldValueToState(sdk.field.getValue()));
  const [editingDisabled, setEditingDisabled] = useState<boolean>(true);
  const sapAPI = useAPI(sdk.parameters as SAPParameters, sdk.ids, sdk.cma);

  useEffect(() => {
    sdk.window.startAutoResizer();

    // Handle external changes (e.g. when multiple authors are working on the same entry).
    sdk.field.onValueChanged((newValue?: string[] | string) => {
      setValue(fieldValueToState(newValue));
    });

    // Disable editing (e.g. when field is not editable due to R&P).
    sdk.field.onIsDisabledChanged((isDisabled: boolean) => {
      setEditingDisabled(isDisabled);
    });
  }, [sdk]);

  const updateStateValue = (skus: string[]) => {
    setValue(skus);

    if (skus.length > 0) {
      const fieldValue = sdk.field.type === 'Array' ? skus : skus[0];
      sdk.field.setValue(fieldValue);
    } else {
      sdk.field.removeValue();
    }
  };

  const onDialogOpen = async () => {
    const skus = await sdk.dialogs.openCurrentApp({
      allowHeightOverflow: true,
      position: 'center',
      title: makeCTAText(sdk.field.type),
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: {
        ...sdk.parameters.installation,
        fieldValue: fieldValueToState(sdk.field.getValue()),
        fieldType: sdk.field.type,
        fieldId: sdk.field.id,
      },
      width: 1400,
      minHeight: 600,
    });

    const result = Array.isArray(skus) ? skus : [];

    if (result.length) {
      updateStateValue(result);
    }
  };

  const hasItems = value.length > 0;
  const fieldType = get(sdk, ['field', 'type'], '');

  return (
    <>
      {hasItems && (
        <div className={styles.sortable}>
          <SortableComponent
            sdk={sdk}
            disabled={editingDisabled}
            skus={value}
            onChange={updateStateValue}
            fetchProductPreviews={sapAPI.fetchProductPreviews}
          />
        </div>
      )}
      <div className={styles.container}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <IconButton
          variant="secondary"
          icon={<ShoppingCartIcon size="small" variant="muted" />}
          onClick={onDialogOpen}
          aria-label={makeCTAText(fieldType)}
          isDisabled={editingDisabled}>
          {makeCTAText(fieldType)}
        </IconButton>
      </div>
    </>
  );
}
