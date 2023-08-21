// Internal - provider agnostic shape

export type AdditionalDataDefaultType = any;

export type Product<AdditionalData = AdditionalDataDefaultType> = {
  sku: string;
  displaySKU?: string;
  image: string;
  id: string;
  name: string;
  externalLink?: string;
  description?: string;
  category?: string;
  additionalData?: AdditionalData;
};

export type Pagination = {
  offset: number;
  total: number;
  count: number;
  limit: number;
  hasNextPage?: boolean;
};

type ProductsFnResponse = {
  pagination: Pagination;
  products: Product[];
};

export type ProductsFn = (
  search: string,
  pagination?: Partial<Pagination>
) => Promise<ProductsFnResponse>;
