import { useEffect } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { Button } from '@contentful/f36-components';

import type { Product as ProductProps } from '../typings';
import { useProduct } from '../hooks/useProduct';
import { Product } from '../components/Product';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [productId, setProductId] = useFieldValue<string>(sdk.field.id, sdk.field.locale);
  const { isLoading, product } = useProduct(productId);

  useEffect(() => {
    // Since we run in an iframe,
    // we need to set the height of the iframe.
    sdk.window.updateHeight(130);
  }, [sdk.window]);

  async function openModal() {
    const product: ProductProps = await sdk.dialogs.openCurrentApp();
    if (product) {
      setProductId(product.id).catch(() => null);
    }
  }

  async function removeProduct() {
    setProductId(null).catch(() => null);
  }

  if (isLoading) {
    return <Product />;
  }

  if (!product) {
    return <Button onClick={openModal}>Select Product</Button>;
  }

  return (
    <div>
      <Product product={product} onClick={removeProduct} ctaText="Remove" />
      <Button onClick={openModal}>Select Product</Button>
    </div>
  );
};

export default Field;
