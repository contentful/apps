import { Pagination, Product } from '@contentful/ecommerce-app-base';

export interface ClientConfig {
  apiEndpoint: string;
}

export type ApiData = ApiResponseCommonData & {
  edges: ApiProductOrVariantEdge[];
};

export interface ApiResponseCommonData {
  pageInfo: PageInfo;
  totalCount: number;
}

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
};

export type ApiProductOrVariantEdge = {
  node: {
    id: string;
    sku?: string;
    name: string;
    images: Image[];
    product?: ApiProduct;
  };
};

export type ProductVariantsData = ApiResponseCommonData & {
  edges: ProductVariantCountableEdge[];
};

export type ProductsData = ApiResponseCommonData & {
  edges: ProductCountableEdge[];
};

export type ProductVariantCountableEdge = {
  node: ApiProductVariant;
  cursor: string;
};

export type ProductCountableEdge = {
  node: ApiProduct;
  cursor: string;
};

export type ApiProductVariant = {
  id: string;
  sku: string;
  name: string;
  images: Image[];
  product: ApiProduct;
};

export type ApiProduct = {
  id: string;
  images: Image[];
  name: string;
};

export type Image = { url: string };

export type ProductsFnResponse = {
  pagination: Pagination;
  products: Product[];
};

export enum DisplayLabelPrefix {
  variantSKU = 'Variant SKU',
  productID = 'Product ID'
}

export type Identifiers = string[];

export type Labels = string[];
