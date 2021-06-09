import React from 'react';
import tokens from '@contentful/forma-36-tokens';
import { css } from '@emotion/css';
import { Product } from '../../interfaces';
import { ProductListItem } from './ProductListItem';

export interface Props {
  products: Product[];
  selectProduct: (sku: string) => void;
  selectedSKUs: string[];
  skuLabel?: string;
  readableIdentifierLabel?: string;
}

const styles = {
  productList: css({
    display: 'flex',
    flexWrap: 'wrap',
    marginLeft: `-${tokens.spacingS}`,
    marginRight: `-${tokens.spacingS}`
  })
};

export const ProductList = ({
  selectProduct,
  selectedSKUs,
  products,
  skuLabel,
  readableIdentifierLabel,
}: Props) => (
  <div className={styles.productList}>
    {products.map(product => (
      <ProductListItem
        key={product.id}
        product={product}
        isSelected={selectedSKUs.includes(product.sku)}
        selectProduct={selectProduct}
        skuLabel={skuLabel}
        readableIdentifierLabel={readableIdentifierLabel}
      />
    ))}
  </div>
);
