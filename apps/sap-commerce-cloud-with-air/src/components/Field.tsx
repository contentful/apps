import { useState, useEffect } from 'react';
import { Button } from '@contentful/f36-components';
import { ShoppingCartIcon } from '@contentful/f36-icons';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import get from 'lodash/get';
import { CategoryPreviews } from './CategoryPreviews/CategoryPreviews';
import logo from '../logo.png';
import { ProductPreviews } from './ProductPreviews/ProductPreviews';
import { apiKey } from '../config';
import { cmaRequest } from '../utils';

const styles = {
  sortable: css({
    marginBottom: tokens.spacingM,
  }),
  container: css({
    display: 'flex',
  }),
  logo: css({
    display: 'block',
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

function makeCTAText(fieldType: string, pickerMode: 'category' | 'product') {
  const isArray = fieldType === 'Array';
  const beingSelected =
    pickerMode === 'category'
      ? isArray
        ? 'categories'
        : 'a category'
      : isArray
      ? 'products'
      : 'a product';
  return `Select ${beingSelected}`;
}

export default async function Field() {
  const sdk = useSDK<FieldAppSDK>();
  const [value, setValue] = useState<string[]>(fieldValueToState(sdk.field.getValue()));
  const [editingDisabled, setEditingDisabled] = useState(true);

  useEffect(() => {
    sdk.window.startAutoResizer();

    // Handle external changes (e.g. when multiple authors are working on the same entry).
    const handleValueChange = (value?: string[] | string) => {
      setValue(fieldValueToState(value));
    };
    sdk.field.onValueChanged(handleValueChange);

    // Disable editing (e.g. when field is not editable due to R&P).
    const handleIsDisabledChange = (editingDisabled: boolean) => {
      setEditingDisabled(editingDisabled);
    };
    sdk.field.onIsDisabledChanged(handleIsDisabledChange);
  }, [sdk.field, sdk.window]);

  const getPickerMode = () => {
    const contentTypeId = sdk.contentType.sys.id;
    const fieldId = sdk.field.id;

    return get(
      sdk,
      ['parameters', 'installation', 'fieldsConfig', contentTypeId, fieldId],
      'product'
    );
  };

  const updateStateValue = (skus: string[]) => {
    setValue(skus);

    if (skus.length > 0) {
      const value = sdk.field.type === 'Array' ? skus : skus[0];
      sdk.field.setValue(value);
    } else {
      sdk.field.removeValue();
    }
  };

  const onDialogOpen = async () => {
    const skus = await sdk.dialogs.openCurrentApp({
      allowHeightOverflow: true,
      position: 'center',
      title: makeCTAText(sdk.field.type, getPickerMode() as 'category' | 'product'),
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: {
        ...sdk.parameters.installation,
        fieldValue: fieldValueToState(sdk.field.getValue()),
        fieldType: sdk.field.type,
        fieldId: sdk.field.id,
        pickerMode: getPickerMode(),
      },
      width: 1400,
      minHeight: 600,
    });
    const result = Array.isArray(skus) ? skus : [];

    if (result.length) {
      updateStateValue(result);
    }
  };

  const data = value;
  const isPickerTypeSetToCategory = getPickerMode() === 'category';
  const hasItems = data.length > 0;
  // const config = sdk.parameters;
  const fieldType = get(sdk, ['field', 'type'], '');

  const handleFetchProductPreviews = async (skus: string[]) => {
    const req = await cmaRequest({
      sdk,
      appActionId: 'fetchProductPreview',
      parameters: {
        skus: JSON.stringify(skus),
      },
    });

    const parsedResponse = JSON.parse(req.response.body);

    return parsedResponse.products;
  };

  const handleFetchCategoryPreviews = async (categories: string[]) => {
    const req = await cmaRequest({
      sdk,
      appActionId: 'fetchCategoryPreview',
      parameters: {
        categories: JSON.stringify(categories),
      },
    });

    const parsedResponse = JSON.parse(req.response.body);

    return parsedResponse.categories;
  };

  return (
    <>
      {hasItems && (
        <div className={styles.sortable}>
          {isPickerTypeSetToCategory ? (
            <CategoryPreviews
              sdk={sdk}
              disabled={editingDisabled}
              categories={data}
              onChange={updateStateValue}
              fetchCategoryPreviews={handleFetchCategoryPreviews}
              applicationInterfaceKey={apiKey}
            />
          ) : (
            <ProductPreviews
              sdk={sdk}
              disabled={editingDisabled}
              skus={data}
              onChange={updateStateValue}
              fetchProductPreviews={handleFetchProductPreviews}
              applicationInterfaceKey={apiKey}
            />
          )}
        </div>
      )}
      <div className={styles.container}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <Button
          startIcon={<ShoppingCartIcon />}
          variant="secondary"
          size="small"
          onClick={onDialogOpen}
          isDisabled={editingDisabled}>
          {makeCTAText(fieldType, getPickerMode() as 'category' | 'product')}
        </Button>
      </div>
    </>
  );
}
