import React from 'react';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { CheckBoxFn, Product } from '../../interfaces';
import { Checkbox, TableCell, TableRow } from '@contentful/f36-components';
import { IconButton } from '@contentful/f36-button';
import get from 'lodash/get';
import { formatProductUrl } from '../../utils';
import { DoneIcon } from '@contentful/f36-icons';

interface Props {
  sdk: DialogExtensionSDK;
  products: Product[];
  selectedProducts: string[];
  baseSite: string;
  checkboxFn: CheckBoxFn;
}

export class ProductList extends React.Component<Props> {
  selectButtonClickEvent(sku: string) {
    const apiEndpoint = get(this.props.sdk.parameters.invocation, 'apiEndpoint', '');
    this.props.sdk.close([formatProductUrl(apiEndpoint, this.props.baseSite, sku)]);
  }

  render() {
    const isFieldTypeSymbol =
      (get(this.props.sdk.parameters.invocation, 'fieldType', '') as string) === 'Symbol';

    return (
      <>
        {this.props.products.map((product, index) => {
          const checkboxValue = this.props.selectedProducts.includes(
            this.props.baseSite + ':' + product.sku
          );
          return (
            <TableRow key={product.sku}>
              <TableCell>
                {isFieldTypeSymbol ? (
                  <IconButton
                    variant="primary"
                    icon={<DoneIcon />}
                    onClick={() => this.selectButtonClickEvent(product.sku)}
                    aria-label="Select">
                    Select
                  </IconButton>
                ) : (
                  <Checkbox
                    id={product.sku}
                    defaultChecked={checkboxValue}
                    onChange={this.props.checkboxFn}
                  />
                )}
              </TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                <img src={product.image} alt="product" />
              </TableCell>
            </TableRow>
          );
        })}
      </>
    );
  }
}
