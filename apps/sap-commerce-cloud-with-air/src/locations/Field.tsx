import { useState, useEffect } from 'react';
import { Button } from '@contentful/f36-components';
import { ShoppingCartIcon } from '@contentful/f36-icons';
import { FieldAppSDK } from '@contentful/app-sdk';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import get from 'lodash/get';
import { fetchCategoryPreviews } from '../api/fetchCategoryPreviews';
import logo from '../logo.png';
import { CategoryPreviews } from '../components/CategoryPreviews/CategoryPreviews';
import { ProductPreviews } from '../components/ProductPreviews/ProductPreviews';
import { apiKey } from '../config';
import { useSDK } from '@contentful/react-apps-toolkit';

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

const FieldComponent = () => {
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
      title: makeCTAText(sdk.field.type, getPickerMode()),
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
  const config = sdk.parameters;
  const fieldType = get(sdk, ['field', 'type'], '');

  const handleFetchProductPreviews = async (skus: string[]) => {
    const req = await sdk.cma.appActionCall.createWithResponse(
      {
        appActionId: 'fetchProductPreview',
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
        appDefinitionId: sdk.ids.app!,
      },
      {
        parameters: {
          sapApiEndpoint: `${sdk.parameters.installation.apiEndpoint}/occ/v2/${sdk.parameters.installation.baseSites}`,
          apiKey,
          skus: JSON.stringify(skus),
        },
      }
    );
    const parsedResponse = JSON.parse(req.response.body);
    return parsedResponse.products;
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
              fetchCategoryPreviews={(categories) =>
                fetchCategoryPreviews(categories, config.installation, apiKey)
              }
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
          {makeCTAText(fieldType, getPickerMode())}
        </Button>
      </div>
    </>
  );
};

export default FieldComponent;
