// Internal - provider agnostic shape

export type Product = {
  sku: string;
  displaySKU?: string;
  image: string;
  id: string;
  name: string;
  externalLink?: string;
  description?: string;
  category?: string;
};

export type Pagination = {
  offset: number;
  total: number;
  count: number;
  limit: number;
  hasNextPage?: boolean;
};

type ProductsFnResponse<P extends Product = Product> = {
  pagination: Pagination;
  products: P[];
};

export type ProductsFn<P extends Product = Product> = (
  search: string,
  pagination?: Partial<Pagination>
) => Promise<ProductsFnResponse<P>>;
