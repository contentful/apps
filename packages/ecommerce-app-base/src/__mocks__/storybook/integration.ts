import { Integration, Product, ProductCardVersion } from '../../types';
import { productsList } from '../products';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logo from '../logo.svg';

export const integration = (
  productCardVersion: ProductCardVersion = 'v1',
  products: Product[] = productsList
): Integration => ({
  logo,
  color: '##ffff',
  description: 'some description',
  name: 'ecommerce integration',
  isInOrchestrationEAP: false,
  parameterDefinitions: [],
  skuTypes: [{ id: 'product', name: 'Product', default: true }],
  makeCTA: () => 'Select SKU',
  isDisabled: () => false,
  renderDialog: () => {},
  openDialog: (_, currentValue: string) => {
    alert(currentValue);
    return Promise.resolve([] as string[]);
  },
  validateParameters: () => '',
  fetchProductPreviews: () => Promise.resolve(products),
  productCardVersion,
});
