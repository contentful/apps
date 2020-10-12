import { uniqBy } from 'lodash';
import { Product } from 'shared-sku-app/src/interfaces';
import { ITEMS_OFFSET } from './constants';
import {
  ApiData,
  ApiProductOrVariantEdge,
  DisplayLabelPrefix,
  Identifiers,
  ProductsData,
  ProductsFnResponse,
  ProductVatiantsData
} from './types';

class DataParser {
  private data: ApiData;
  private productsIds: string[];

  private static paginationConfig = {
    count: ITEMS_OFFSET,
    limit: ITEMS_OFFSET,
    offset: ITEMS_OFFSET
  };

  constructor(data: ProductsData | ProductVatiantsData, productsIds: Identifiers = []) {
    this.data = data;
    this.productsIds = productsIds;
  }

  getParsedData = (): ProductsFnResponse => ({
    pagination: this.getParsedPagination(),
    products: this.getParsedProductsAndVariants()
  });

  private getParsedPagination = () => ({
    ...DataParser.paginationConfig,
    total: this.selectItemsTotal(),
    hasNextPage: this.data.pageInfo.hasNextPage
  });

  private selectItemsTotal = () =>
    this.data.totalCount > ITEMS_OFFSET
      ? this.data.totalCount
      : this.getParsedProductsAndVariants().length;

  private getParsedProductsAndVariants = () => [
    ...this.getParsedProductsOfVariants(),
    ...this.getParsedItems()
  ];

  getFilteredItems = (data: Product[]) => data.filter(this.shouldDisplayProduct);

  getParsedItems = (): Product[] => this.data.edges.map(DataParser.getParsedItem);

  getProductOfVariantsIds = (): string[] => this.getParsedProductsOfVariants().map(({ id }) => id);

  private getParsedProductsOfVariants = (): Product[] =>
    uniqBy(
      this.data.edges
        .map<ApiProductOrVariantEdge>(
          ({ node: { product } }: ApiProductOrVariantEdge) =>
            ({
              node: product
            } as ApiProductOrVariantEdge)
        )
        .map<Product>(DataParser.getParsedItem)
        .filter(this.shouldDisplayProduct),
      'id'
    );

  private shouldDisplayProduct = ({ id }: Product): boolean => !this.productsIds.includes(id);

  private static getParsedItem = ({
    node: { id, name, sku, images, product }
  }: ApiProductOrVariantEdge) => {
    const fullName = product?.name ? `${product.name} ${name}` : name;

    return {
      id,
      sku: DataParser.getDisplayLabel(id, sku),
      name: fullName,
      image: images[0]?.url || product?.images[0]?.url || ''
    };
  };

  private static getDisplayLabel = (id: string, sku?: string) =>
    sku ? `${DisplayLabelPrefix.variantSKU}: ${sku}` : `${DisplayLabelPrefix.productID}: ${id}`;
}

export default DataParser;
