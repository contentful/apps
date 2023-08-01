import { DialogAppSDK } from '@contentful/app-sdk';
import { Button, Checkbox, TableCell, TableRow } from '@contentful/f36-components';
import { DoneIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import get from 'lodash/get';
import { CheckBoxFn, Product } from '../../interfaces';

interface Props {
  sdk: DialogAppSDK;
  products: Product[];
  selectedProducts: string[];
  baseSite: string;
  checkboxFn: CheckBoxFn;
}

export default function ProductList({ products, selectedProducts, baseSite, checkboxFn }: Props) {
  const sdk = useSDK<DialogAppSDK>();

  const selectButtonClickEvent = (sku: string) => {
    const apiEndpoint = get(sdk.parameters.invocation, 'apiEndpoint', '');
    sdk.close([`${apiEndpoint}/occ/v2/${baseSite}/products/${sku}`]);
  };

  const isFieldTypeSymbol =
    (get(sdk.parameters.invocation, 'fieldType', '') as string) === 'Symbol';

  return (
    <>
      {products.map((product, index) => {
        const checkboxValue = selectedProducts.includes(baseSite + ':' + product.sku);
        return (
          <TableRow key={product.sku}>
            <TableCell>
              {isFieldTypeSymbol ? (
                <Button
                  variant="primary"
                  startIcon={<DoneIcon />}
                  onClick={() => selectButtonClickEvent(product.sku)}>
                  Select
                </Button>
              ) : (
                <Checkbox id={product.sku} defaultChecked={checkboxValue} onChange={checkboxFn} />
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
