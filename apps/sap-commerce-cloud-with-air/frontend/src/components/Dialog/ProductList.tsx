import React from 'react';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { CheckBoxFn, Product } from '../../interfaces';
import { Button, Checkbox, TableCell, TableRow } from '@contentful/f36-components';
import { DoneIcon } from '@contentful/f36-icons';
import get from 'lodash/get';

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
    this.props.sdk.close([`${apiEndpoint}/occ/v2/${this.props.baseSite}/products/${sku}`]);
  }

  render() {
    const isFieldTypeSymbol =
      (get(this.props.sdk.parameters.invocation, 'fieldType', '') as string) === 'Symbol';

    return (
      <>
        {this.props.products.map((product, index) => {
          const checkboxValue = this.props.selectedProducts.includes(
            this.props.baseSite + ':' + product.sku,
          );
          return (
            <TableRow key={product.sku}>
              <TableCell>
                {isFieldTypeSymbol ? (
                  <Button
                    variant="primary"
                    startIcon={<DoneIcon />}
                    onClick={() => this.selectButtonClickEvent(product.sku)}>
                    Select
                  </Button>
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
