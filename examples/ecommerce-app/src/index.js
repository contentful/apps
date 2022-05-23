import './index.css';
import { setup } from '@contentful/ecommerce-app-base';
import { EntityList } from '@contentful/f36-components';
import { render } from 'react-dom';
import { useEffect, useState } from 'react';

setup({
  makeCTA: () => 'Select a product',
  name: 'Contentful E-Commerce Demo App',
  logo: 'https://images.ctfassets.net/fo9twyrwpveg/6eVeSgMr2EsEGiGc208c6M/f6d9ff47d8d26b3b238c6272a40d3a99/contentful-logo.png',
  color: '#036FE3',
  description:
    'This is a sample Application to demonstrate how to make a custom E-commerce application on top of Contentful.',
  parameterDefinitions: [
    {
      id: 'apiKey',
      type: 'Number',
      name: 'API Id',
      description: 'Provide the API Key here',
      required: true,
    },
    {
      id: 'projectId',
      type: 'Number',
      name: 'Project Id',
      description: 'Provide the Project Id here',
      required: true,
    },
  ],
  validateParameters,
  fetchProductPreviews,
  renderDialog,
  openDialog,
  isDisabled: () => false,
});

function DialogLocation({ sdk }) {
  const apiKey = sdk.parameters.installation.apiKey;
  const projectId = sdk.parameters.installation.projectId;

  const [products, setProducts] = useState();
  useEffect(async () => {
    const fetchProducts = async () => {
      const response = await fetch(
        `/ecommerce_api_response.json?api_key=${apiKey}&project_id=${projectId}`
      );
      return response.json();
    };

    fetchProducts().then(setProducts);
  }, [apiKey, projectId]);

  if (products === undefined) {
    return <div>Please wait</div>;
  }

  return (
    <EntityList>
      {products.map((product) => (
        <EntityList.Item
          key={product.id}
          title={product.name}
          description="Description"
          thumbnailUrl={product.image}
          onClick={() => sdk.close([product.sku])}
        />
      ))}
    </EntityList>
  );
}

async function fetchProductPreviews(skus, parameters) {
  const apiKey = parameters.apiKey;
  const projectId = parameters.projectId;

  const response = await fetch(
    `/ecommerce_api_response.json?api_key=${apiKey}&project_id=${projectId}`
  );
  const products = await response.json();
  return products.filter((product) => skus.includes(product.sku));
}

async function renderDialog(sdk) {
  render(<DialogLocation sdk={sdk} />, document.getElementById('root'));
  sdk.window.startAutoResizer();
}

async function openDialog(sdk, _currentValue, _config) {
  const skus = await sdk.dialogs.openCurrentApp({
    position: 'center',
    title: 'Sample E-Commerce Demo App',
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    width: 400,
    allowHeightOverflow: true,
  });

  return Array.isArray(skus) ? skus : [];
}

function validateParameters({ apiKey, projectId }) {
  if (!apiKey) {
    return 'Please add a API Key';
  }

  if (!projectId) {
    return 'Please add a Project Id';
  }

  return null;
}
