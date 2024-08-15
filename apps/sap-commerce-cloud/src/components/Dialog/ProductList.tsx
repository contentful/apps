import { DialogExtensionSDK } from '@contentful/app-sdk';
import { CheckBoxFn, Product } from '../../interfaces';
import { Checkbox, IconButton, TableCell, TableRow } from '@contentful/f36-components';
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

export function ProductList(props: Props) {
  const selectButtonClickEvent = (sku: string) => {
    const apiEndpoint = get(props.sdk.parameters.invocation, 'apiEndpoint', '') as string;
    props.sdk.close([formatProductUrl(apiEndpoint, props.baseSite, sku)]);
  };

  const isFieldTypeSymbol =
    (get(props.sdk.parameters.invocation, 'fieldType', '') as string) === 'Symbol';
  return (
    <>
      {props.products.map((product, index) => {
        const checkboxValue = props.selectedProducts.includes(props.baseSite + ':' + product.sku);
        return (
          <TableRow key={product.sku}>
            <TableCell>
              {isFieldTypeSymbol ? (
                <IconButton
                  variant="primary"
                  icon={<DoneIcon />}
                  onClick={() => selectButtonClickEvent(product.sku)}
                  aria-label="Select">
                  Select
                </IconButton>
              ) : (
                <Checkbox
                  id={product.sku}
                  defaultChecked={checkboxValue}
                  onChange={props.checkboxFn}
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
