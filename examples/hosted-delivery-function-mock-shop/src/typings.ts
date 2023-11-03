export type Product = {
  id: string;
  title: string;
  featuredImage: {
    url: string;
  };
};

export type ProductCollection = {
  products: {
    edges: readonly {
      node: Product;
    }[];
  };
};

export type Products = readonly Product[];
