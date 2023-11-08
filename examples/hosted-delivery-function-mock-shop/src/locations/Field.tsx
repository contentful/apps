import { useEffect, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Button } from '@contentful/f36-components';

import type { Product as ProductProps } from '../typings';
import { useProduct } from '../hooks/useProduct';
import { Product } from '../components/Product';

const Field = () => {
  const [productId, setProductId] = useState<string | undefined>();
  const sdk = useSDK<FieldAppSDK>();
  const { isLoading, product } = useProduct(productId);
  const value = sdk.entry.fields['productId'].getValue();

  useEffect(() => {
    sdk.window.updateHeight(100);
  }, [sdk.window]);

  useEffect(() => {
    if (value) {
      setProductId(value);
    }
  }, [value]);

  async function openModal() {
    const product: ProductProps = await sdk.dialogs.openCurrentApp();
    if (product) {
      sdk.entry.fields['productId'].setValue(product.id);
      setProductId(product.id);
    }
  }

  if (isLoading) {
    return <Product />;
  }

  if (!product) {
    return <Button onClick={openModal}>Select Product</Button>;
  }

  return <Product product={product} onClick={openModal} ctaText="Select product" />;
};

export default Field;
