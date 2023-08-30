import { Product } from '../types';
import { LinkDataItemRenderer } from '../AdditionalDataRenderer/MetaDataRenderer';

export const productsList: Product[] = [
  {
    id: '28a7442d',
    image:
      'https://images.ctfassets.net/juh8bvgveao4/QoAO8rqn86a4jiH1yudiN/e518fd9263b67705c3ffb041bd217bda/imageService.webp',
    name: 'Dress Twin-Set rose',
    sku: 'M0E20130820E90Z',
    externalLink: 'https://mc.commercetools.com/example-project/products/28a7442d/general',
    description:
      'Open your door to the world of grilling with the sleek Spirit II E-210 gas grill. This two burner grill is built to fit small spaces, and packed with features such as the powerful GS4 grilling system, iGrill capability, and convenient side tables for placing serving trays. Welcome to the Weber family.',
  },
  {
    id: '4e5446e8',
    image:
      'https://images.ctfassets.net/juh8bvgveao4/QoAO8rqn86a4jiH1yudiN/e518fd9263b67705c3ffb041bd217bda/imageService.webp',
    name: 'Michael Kors – Shopper “Jet Set Travel”',
    sku: 'A0E2300FX102203',
    externalLink: 'https://mc.commercetools.com/example-project/products/4e5446e8/general',
    description:
      'Open your door to the world of grilling with the sleek Spirit II E-210 gas grill. This two burner grill is built to fit small spaces, and packed with features such as the powerful GS4 grilling system, iGrill capability, and convenient side tables for placing serving trays. Welcome to the Weber family.',
  },
  {
    id: 'db3c234l',
    image:
      'https://images.ctfassets.net/juh8bvgveao4/QoAO8rqn86a4jiH1yudiN/e518fd9263b67705c3ffb041bd217bda/imageService.webp',
    name: 'Shirt “Jenny“ Polo Ralph Lauren white',
    sku: 'M0E21300900DZN7',
    externalLink: 'https://mc.commercetools.com/example-project/products/db3c234l/general',
    description:
      'Open your door to the world of grilling with the sleek Spirit II E-210 gas grill. This two burner grill is built to fit small spaces, and packed with features such as the powerful GS4 grilling system, iGrill capability, and convenient side tables for placing serving trays. Welcome to the Weber family.',
  },
];

export const products = productsList.reduce((previousValue, currentValue: Product) => {
  previousValue[currentValue.name] = currentValue;
  return previousValue;
}, {} as Record<string, Product>);

export const columns = [
  {
    title: 'Shopify activity',
    items: [
      {
        name: 'Status',
        value: 'active',
      },
      {
        name: 'Inventory',
        value: '35 out of 40',
      },
      {
        name: 'Created',
        value: 'tbd',
      },
      {
        name: 'Updated',
        value: 'tbd',
      },
    ],
  },
  {
    title: 'Product information',
    items: [
      {
        name: 'Price',
        value: '$20.00',
      },
      {
        name: 'Sizes',
        value: 'XL',
      },
      {
        name: 'Vendor',
        value: 'Surley',
      },
      () => <LinkDataItemRenderer href={'#'} text={'More information'} />,
    ],
  },
];
