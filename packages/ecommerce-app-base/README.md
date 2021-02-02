[![CircleCI](https://circleci.com/gh/contentful/apps.svg?style=svg&circle-token=913f0d4852062fbed644fca927d059d5e3e72908)](https://circleci.com/gh/contentful/apps)

# ecommerce-app-base

`@contentful/ecommerce-app-base` is a library that helps you to quickly build an app to integrate your e-commerce system of choice with Contentful. Many e-commerce integrations are very similar, therefore this library provides the boilerplate for your app and you only need to add the code for your specific service.

This library creates an app which can be used in the entry field location to select stock keeping units (sku) from your e-commerce service. The library also provides a configuration screen for an easy customization.

## Usage

```javascript
import { setup } from '@contentful/ecommerce-app-base';

setup({
  makeCTA: () => 'Select products',
  name: 'My SKU App',
  logo: 'https://example.com/logo.svg',
  color: '#d7f0fa',
  description: 'My example SKU App',
  parameterDefinitions: [
    {
      "id": "category",
      "type": "Symbol",
      "name": "Catehory",
      "description": "Product category of our shop",
      "required": true
    }
  ],
  validateParameters: () => null,
  fetchProductPreviews: async (skus) => {
      const responess = await Promise.all(
          skus.map(sku => fetch(`https://example.com/products/${sku}`))
      );
      return responses.map(response => response.json());
  },
  renderDialog: (sdk) => {
    const config = sdk.parameters.invocation;

    const container = document.createElement('div');
    container.innerHTML = `<iframe src="https://example.com/products-search?category=${config.category}" />`;
    document.body.appendChild(container);
  },
  openDialog: async (sdk, currentValue, config) => {
    return await sdk.dialogs.openCurrentApp({
      parameters: { config, currentValue },
    });
  },
  isDisabled: () => false
});
```

[Type Documentation](docs/README.md)

## Apps

These Contentful apps use `@contentful/ecommerce-app-base`. Look at their source code to learn how they utilize this library:

- [Commerce Layer](../../apps/commercelayer)
- [Saleor](../../apps/saleor)
- [Shopify](../../apps/shopify)
