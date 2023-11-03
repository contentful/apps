import { useEffect } from "react";
import { Box, Button, Modal } from "@contentful/f36-components";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";

import type { Product as ProductProps } from "../typings";
import { useProducts } from "../hooks/useProducts";
import { Product } from "../components/Product";
import { ProductList } from "../components/ProductList";

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const { isLoading, products } = useProducts();

  useEffect(() => {
    sdk.window.updateHeight(500);
  }, [sdk.window]);

  if (isLoading && !products) {
    return new Array(10)
      .fill(undefined)
      .map((_, index) => <Product key={index} />);
  }

  function selectProduct(product?: ProductProps) {
    sdk.close(product);
  }

  return (
    <Box padding="spacingM">
      <Modal.Header title="Select a product">
        <Button onClick={() => selectProduct(undefined)}>Dismiss</Button>
      </Modal.Header>
      <Modal.Content>
        <ProductList products={products} onSelect={selectProduct} />
      </Modal.Content>
      <Modal.Controls>
        <Button onClick={() => selectProduct(undefined)}>Dismiss</Button>
      </Modal.Controls>
    </Box>
  );
};

export default Dialog;
