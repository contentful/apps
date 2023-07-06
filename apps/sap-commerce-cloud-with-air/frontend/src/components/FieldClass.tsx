import React from 'react';
import { Button } from '@contentful/f36-components';
import { ShoppingCartIcon } from '@contentful/f36-icons';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import get from 'lodash/get';
import { ProductPreviews } from './ProductPreviews/ProductPreviews';
import { CategoryPreviews } from './CategoryPreviews/CategoryPreviews';
import { fetchProductPreviews } from '../api/fetchProductPreviews';
import { fetchCategoryPreviews } from '../api/fetchCategoryPreviews';
import logo from '../logo.png';
import { PlainClientAPI } from 'contentful-management/dist/typings/plain/common-types';

interface Props {
  sdk: FieldExtensionSDK;
  cma: PlainClientAPI;
  applicationInterfaceKey: string;
}

interface State {
  value: string[];
  editingDisabled: boolean;
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

export default class FieldClass extends React.Component<Props, State> {
  state = {
    value: fieldValueToState(this.props.sdk.field.getValue()),
    editingDisabled: true,
  };

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();

    // Handle external changes (e.g. when multiple authors are working on the same entry).
    this.props.sdk.field.onValueChanged((value?: string[] | string) => {
      this.setState({ value: fieldValueToState(value) });
    });

    // Disable editing (e.g. when field is not editable due to R&P).
    this.props.sdk.field.onIsDisabledChanged((editingDisabled: boolean) => {
      this.setState({ editingDisabled });
    });
  }

  getPickerMode = () => {
    const { sdk } = this.props;
    const contentTypeId = sdk.contentType.sys.id;
    const fieldId = sdk.field.id;

    return get(
      sdk,
      ['parameters', 'installation', 'fieldsConfig', contentTypeId, fieldId],
      'product',
    );
  };

  updateStateValue = (skus: string[]) => {
    this.setState({ value: skus });

    if (skus.length > 0) {
      const value = this.props.sdk.field.type === 'Array' ? skus : skus[0];
      this.props.sdk.field.setValue(value);
    } else {
      this.props.sdk.field.removeValue();
    }
  };

  onDialogOpen = async () => {
    const { sdk } = this.props;

    const skus = await sdk.dialogs.openCurrentApp({
      allowHeightOverflow: true,
      position: 'center',
      title: makeCTAText(sdk.field.type, this.getPickerMode()),
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: {
        ...sdk.parameters.installation,
        fieldValue: fieldValueToState(sdk.field.getValue()),
        fieldType: sdk.field.type,
        fieldId: sdk.field.id,
        pickerMode: this.getPickerMode(),
      },
      width: 1400,
      minHeight: 600,
    });
    const result = Array.isArray(skus) ? skus : [];

    if (result.length) {
      this.updateStateValue(result);
    }
  };

  render = () => {
    const { value: data, editingDisabled } = this.state;

    const isPickerTypeSetToCategory = this.getPickerMode() === 'category';
    const hasItems = data.length > 0;
    const config = this.props.sdk.parameters;
    const fieldType = get(this.props, ['sdk', 'field', 'type'], '');

    return (
      <>
        {hasItems && (
          <div className={styles.sortable}>
            {isPickerTypeSetToCategory ? (
              <CategoryPreviews
                sdk={this.props.sdk}
                disabled={editingDisabled}
                categories={data}
                onChange={this.updateStateValue}
                fetchCategoryPreviews={(categories) =>
                  fetchCategoryPreviews(
                    categories,
                    config.installation,
                    this.props.applicationInterfaceKey,
                  )
                }
                applicationInterfaceKey={this.props.applicationInterfaceKey}
              />
            ) : (
              <ProductPreviews
                sdk={this.props.sdk}
                disabled={editingDisabled}
                skus={data}
                onChange={this.updateStateValue}
                fetchProductPreviews={async (skus) =>
                  await fetchProductPreviews(
                    skus,
                    this.props.sdk.parameters as any,
                    this.props.applicationInterfaceKey,
                    this.props.sdk,
                    this.props.cma,
                  )
                }
                applicationInterfaceKey={this.props.applicationInterfaceKey}
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
            onClick={this.onDialogOpen}
            isDisabled={editingDisabled}>
            {makeCTAText(fieldType, this.getPickerMode())}
          </Button>
        </div>
      </>
    );
  };
}
