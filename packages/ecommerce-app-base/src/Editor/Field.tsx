import { FieldExtensionSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { ShoppingCartIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import * as React from 'react';
import { FieldsSkuTypes } from '../AppConfig/fields';
import {
  DisabledPredicateFn,
  Integration,
  MakeCTAFn,
  OpenDialogFn,
  ProductPreviewsFn,
} from '../interfaces';
import { SortableComponent } from './SortableComponent';

interface Props {
  sdk: FieldExtensionSDK;
  makeCTA: MakeCTAFn;
  logo: string;
  fetchProductPreviews: ProductPreviewsFn;
  openDialog: OpenDialogFn;
  isDisabled: DisabledPredicateFn;
  skuTypes?: Integration['skuTypes'];
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

export default class Field extends React.Component<Props, State> {
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
    const currentValue = this.state.value;
    const { skuTypes, sdk } = this.props;
    const config = sdk.parameters.installation;

    const defaultSkuType = skuTypes?.find((skuType) => skuType.default === true)?.id;
    const skuType =
      (config as { skuTypes?: FieldsSkuTypes }).skuTypes?.[sdk.contentType.sys.id]?.[
        sdk.field.id
      ] ?? defaultSkuType;

    const result = await this.props.openDialog(sdk, currentValue, {
      ...config,
      fieldValue: fieldValueToState(sdk.field.getValue()),
      fieldType: sdk.field.type,
      skuType,
    });
    if (result.length) {
      this.updateStateValue(result);
    }
  };

  render = () => {
    const { value: selectedSKUs, editingDisabled } = this.state;
    const { skuTypes, sdk } = this.props;

    const hasItems = selectedSKUs.length > 0;
    const config = sdk.parameters.installation;
    const isDisabled = editingDisabled || this.props.isDisabled(selectedSKUs, config);

    const defaultSkuType = skuTypes?.find((skuType) => skuType.default === true)?.id;
    const skuType =
      (config as { skuTypes?: FieldsSkuTypes }).skuTypes?.[sdk.contentType.sys.id]?.[
        sdk.field.id
      ] ?? defaultSkuType;

    return (
      <>
        {hasItems && (
          <div className={styles.sortable}>
            <SortableComponent
              sdk={sdk}
              disabled={editingDisabled}
              skus={selectedSKUs}
              onChange={this.updateStateValue}
              config={config}
              fetchProductPreviews={this.props.fetchProductPreviews}
              skuType={skuType}
            />
          </div>
        )}
        <div className={styles.container}>
          <img src={this.props.logo} alt="Logo" className={styles.logo} />
          <Button
            startIcon={<ShoppingCartIcon />}
            variant="secondary"
            size="small"
            onClick={this.onDialogOpen}
            isDisabled={isDisabled}
          >
            {this.props.makeCTA(sdk.field.type, skuType)}
          </Button>
        </div>
      </>
    );
  };
}
