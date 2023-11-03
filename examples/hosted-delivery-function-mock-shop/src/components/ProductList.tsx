import type { ReactElement } from "react";
import { List } from "@contentful/f36-components";
import { css } from "emotion";
import tokens from "@contentful/f36-tokens";

import type { Products, Product as ProductProps } from "../typings";
import { Product } from "./Product";

const styles = {
  productList: css`
    padding: 0;
  `,
  productItemContainer: css`
    max-height: 100px;
  `,
  productItem: css`
    max-height: 100px;
    box-sizing: border-box;
    padding: ${tokens.spacingS} 0;
    list-style: none;
    &:hover {
      background-color: ${tokens.gray100};
    }
  `
};


type Props = {
  products?: Products;
  onSelect: (product: ProductProps) => void;
}

export function ProductList({ products, onSelect }: Props): ReactElement {
  return <List className={styles.productList}>
    {products?.map((product) => (
      <List.Item key={product.id} className={styles.productItem}>
        <Product product={product} onClick={() => onSelect(product)} />
      </List.Item>
    ))}
  </List>
}
