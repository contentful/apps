import React from 'react';
import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/css';
import { Product } from '../../types';
import { ProductListItem } from './ProductListItem';

export interface Props {
  products: Product[];
  selectProduct: (sku: string) => void;
  selectedSKUs: string[];
}

const styles = {
  productList: css({
    display: 'flex',
    flexWrap: 'wrap',
    marginLeft: `-${tokens.spacingS}`,
    marginRight: `-${tokens.spacingS}`,
  }),
};

export function ProductList({ selectProduct, selectedSKUs, products }: Props) {
  return (
    <div className={styles.productList}>
      {products.map((product) => (
        <ProductListItem
          key={product.id}
          product={product}
          isSelected={selectedSKUs.includes(product.sku)}
          selectProduct={selectProduct}
        />
      ))}
    </div>
  );
}
