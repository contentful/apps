import React, { useState, useEffect } from 'react';
import { Button } from '@contentful/f36-components';
import { ShoppingCartIcon } from '@contentful/f36-icons';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import get from 'lodash/get';
import { CategoryPreviews } from './CategoryPreviews/CategoryPreviews';
import { fetchCategoryPreviews } from '../api/fetchCategoryPreviews';
import logo from '../logo.png';
import { ProductPreviews } from './ProductPreviews/ProductPreviews';
import { apiKey } from '../config';

interface Props {
  sdk: FieldExtensionSDK;
  cma: any;
  applicationInterfaceKey: string;
}

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

const FieldComponent: React.FC<Props> = (props) => {
  const [value, setValue] = useState<string[]>(fieldValueToState(props.sdk.field.getValue()));
  const [editingDisabled, setEditingDisabled] = useState(true);

  useEffect(() => {
    props.sdk.window.startAutoResizer();

    // Handle external changes (e.g. when multiple authors are working on the same entry).
    const handleValueChange = (value?: string[] | string) => {
      setValue(fieldValueToState(value));
    };
    props.sdk.field.onValueChanged(handleValueChange);

    // Disable editing (e.g. when field is not editable due to R&P).
    const handleIsDisabledChange = (editingDisabled: boolean) => {
      setEditingDisabled(editingDisabled);
    };
    props.sdk.field.onIsDisabledChanged(handleIsDisabledChange);
  }, [props.sdk.field, props.sdk.window]);

  const getPickerMode = () => {
    const { sdk } = props;
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
      const value = props.sdk.field.type === 'Array' ? skus : skus[0];
      props.sdk.field.setValue(value);
    } else {
      props.sdk.field.removeValue();
    }
  };

  const onDialogOpen = async () => {
    const { sdk } = props;

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
  const config = props.sdk.parameters;
  const fieldType = get(props, ['sdk', 'field', 'type'], '');

  const handleFetchProductPreviews = async (skus: string[]) => {
    const req = await props.sdk.cma.appActionCall.createWithResponse(
      {
        appActionId: 'fetchProductPreview',
        environmentId: props.sdk.ids.environment,
        spaceId: props.sdk.ids.space,
        appDefinitionId: props.sdk.ids.app!,
      },
      {
        parameters: {
          sapApiEndpoint: `${props.sdk.parameters.installation.apiEndpoint}/occ/v2/${props.sdk.parameters.installation.baseSites}`,
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
              sdk={props.sdk}
              disabled={editingDisabled}
              categories={data}
              onChange={updateStateValue}
              fetchCategoryPreviews={(categories) =>
                fetchCategoryPreviews(
                  categories,
                  config.installation,
                  props.applicationInterfaceKey
                )
              }
              applicationInterfaceKey={props.applicationInterfaceKey}
            />
          ) : (
            <ProductPreviews
              sdk={props.sdk}
              disabled={editingDisabled}
              skus={data}
              onChange={updateStateValue}
              fetchProductPreviews={handleFetchProductPreviews}
              applicationInterfaceKey={props.applicationInterfaceKey}
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
