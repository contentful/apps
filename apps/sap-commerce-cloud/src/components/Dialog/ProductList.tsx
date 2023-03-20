import React from 'react';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { CheckBoxFn, Product } from '../../interfaces';
import { Button, Checkbox, TableCell, TableRow } from '@contentful/forma-36-react-components';
import get from 'lodash/get';

interface Props {
  sdk: DialogExtensionSDK;
  products: Product[];
  selectedProducts: string[];
  baseSite: string;
  checkboxFn: CheckBoxFn;
}

export class ProductList extends React.Component<Props> {
  componentDidMount() {
    console.log('Product List initiated');
  }

  selectButtonClickEvent(sku: string) {
    const skuId = this.props.baseSite + ':' + sku;
    this.props.sdk.close([skuId]);
  }

  render() {
    const isFieldTypeSymbol =
      get(this.props.sdk.parameters.invocation, 'fieldType', '') === 'Symbol';

    return (
      <>
        {this.props.products.map((product, index) => {
          const checkboxValue = this.props.selectedProducts.includes(
            this.props.baseSite + ':' + product.sku
          )
            ? true
            : false;
          return (
            <TableRow key={product.sku}>
              <TableCell>
                {isFieldTypeSymbol ? (
                  <Button
                    buttonType="primary"
                    icon="Done"
                    onClick={() => this.selectButtonClickEvent(product.sku)}>
                    Select
                  </Button>
                ) : (
                  <Checkbox
                    labelText={''}
                    id={product.sku}
                    defaultChecked={checkboxValue}
                    onChange={this.props.checkboxFn}
                  />
                )}
              </TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                <img src={product.image} />
              </TableCell>
            </TableRow>
          );
        })}
      </>
    );
  }
}
