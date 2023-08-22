import { AdditionalDataDefaultType, Integration } from '../../types';
import { productsList } from '../products';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logo from '../logo.svg';

export function integration<AdditionalDataType = AdditionalDataDefaultType>(
  integrationOverride: Partial<Integration<AdditionalDataType>>,
  products = productsList
): Integration<AdditionalDataType> {
  return {
    logo,
    color: '##ffff',
    description: 'some description',
    name: 'Ecommerce',
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
    productCardVersion: 'v1',
    ...integrationOverride,
  };
}
