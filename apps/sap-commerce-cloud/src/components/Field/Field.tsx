import React from 'react';
import { Button, IconButton } from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import get from 'lodash/get';
import { SortableComponent } from '../ProductPreviews/SortableComponent';
import { fetchProductPreviews } from '../../api/fetchProductPreviews';
import logo from '../../logo.png';
import { AppParameters, SAPParameters } from '../../interfaces';
import { styles } from './Field.styles';
import { ShoppingCartIcon } from '@contentful/f36-icons';

interface Props {
  sdk: FieldAppSDK<AppParameters>;
}

interface State {
  value: string[];
  editingDisabled: boolean;
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
    const { sdk } = this.props;

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
      this.updateStateValue(result);
    }
  };

  render = () => {
    const { value: data, editingDisabled } = this.state;

    const hasItems = data.length > 0;
    const fieldType = get(this.props, ['sdk', 'field', 'type'], '');

    return (
      <>
        {hasItems && (
          <div className={styles.sortable}>
            <SortableComponent
              sdk={this.props.sdk}
              disabled={editingDisabled}
              skus={data}
              onChange={this.updateStateValue}
              fetchProductPreviews={(skus) =>
                fetchProductPreviews(skus, this.props.sdk.parameters as SAPParameters)
              }
            />
          </div>
        )}
        <div className={styles.container}>
          <img src={logo} alt="Logo" className={styles.logo} />
          <IconButton
            icon={<ShoppingCartIcon size="small" variant="muted" />}
            onClick={this.onDialogOpen}
            aria-label={makeCTAText(fieldType)}
            isDisabled={editingDisabled}>
            {makeCTAText(fieldType)}
          </IconButton>
        </div>
      </>
    );
  };
}
