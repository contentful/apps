import React, { Component } from 'react';
import get from 'lodash/get';
import clamp from 'lodash/clamp';
import debounce from 'lodash/debounce';
import { DialogAppSDK } from '@contentful/app-sdk';
import { ProductList } from './ProductList';
import { Paginator } from './Paginator';
import {
  MakeSaveBtnTextFn,
  MakeSearchPlaceholderText,
  MakeSearchHelpText,
  Pagination,
  Product,
  ProductPreviewsFn,
  ProductsFn,
} from '../types';
import { ProductSelectionList } from './ProductSelectionList';
import { styles } from './styles';
import { mapSort } from '../utils';

import { Button, Checkbox, Flex, Text, TextInput } from '@contentful/f36-components';

import { SearchIcon } from '@contentful/f36-icons';

export interface Props {
  sdk: DialogAppSDK;
  fetchProductPreviews: ProductPreviewsFn;
  fetchProducts: ProductsFn;
  searchDelay?: number;
  skuType?: string;
  makeSaveBtnText?: MakeSaveBtnTextFn;
  makeSearchPlaceholderText?: MakeSearchPlaceholderText;
  makeSearchHelpText?: MakeSearchHelpText;
  hideSearch?: boolean;
  showSearchBySkuOption?: boolean;
}

interface State {
  activePage: number;
  search: string;
  pagination: Pagination;
  products: Product[];
  selectedProducts: Product[];
  selectedSKUs: string[];
  searchBySku: boolean;
}

const DEFAULT_SEARCH_DELAY = 250;

function defaultGetSaveBtnText(selectedSKUs: string[]): string {
  switch (selectedSKUs.length) {
    case 0:
      return 'Save products';
    case 1:
      return 'Save 1 product';
    default:
      return `Save ${selectedSKUs.length} products`;
  }
}

function defaultMakeSearchPlaceholderText(_skuType?: string): string {
  return 'Search for a product...';
}

export class SkuPicker extends Component<Props, State> {
  state: State = {
    activePage: 1,
    search: '',
    pagination: {
      count: 0,
      limit: 0,
      offset: 0,
      total: 0,
    },
    products: [],
    selectedProducts: [],
    selectedSKUs: get(this.props, ['sdk', 'parameters', 'invocation', 'fieldValue'], []),
    searchBySku: false,
  };

  setSearchCallback: () => void;

  constructor(props: Props) {
    super(props);
    this.setSearchCallback = debounce(() => {
      this.setActivePage(1);
    }, this.props.searchDelay || DEFAULT_SEARCH_DELAY);
  }

  componentDidMount() {
    this.updateProducts();
    this.updateSelectedProducts();
  }

  setSearch = (search: string) => {
    this.setState({ search }, this.setSearchCallback);
  };

  setSearchBySku = () => {
    this.setState({ searchBySku: !this.state.searchBySku }, this.setSearchCallback);
  };

  updateProducts = async () => {
    try {
      const {
        activePage,
        pagination: { limit },
        search,
      } = this.state;
      const offset = (activePage - 1) * limit;
      const fetched = await this.props.fetchProducts(search, { offset }, this.state.searchBySku);
      // If the request has been cancelled because a new one has been launched
      // then fetchProducts will return null
      if (fetched && fetched.pagination && fetched.products) {
        this.setState({ pagination: fetched.pagination, products: fetched.products });
      }
    } catch (error) {
      this.props.sdk.notifier.error('There was an error fetching the product list.');
    }
  };

  updateSelectedProducts = async () => {
    try {
      const { selectedSKUs } = this.state;
      const { sdk, skuType, fetchProductPreviews } = this.props;
      const config = sdk.parameters.installation;
      const selectedProductsUnsorted = await fetchProductPreviews(selectedSKUs, config, skuType);
      const selectedProducts = mapSort(selectedProductsUnsorted, selectedSKUs, 'sku');
      this.setState({ selectedProducts });
    } catch (error) {
      this.props.sdk.notifier.error(
        'There was an error fetching the data for the selected products.'
      );
    }
  };

  loadMoreProducts = async () => {
    const { pagination, products } = await this.props.fetchProducts(this.state.search);
    this.setState((oldState) => ({ pagination, products: [...oldState.products, ...products] }));
  };

  setActivePage = (activePage: number) => {
    const { pagination } = this.state;
    const pageCount = Math.ceil(pagination.total / pagination.limit);
    this.setState({ activePage: clamp(activePage, 1, pageCount) }, () => {
      this.updateProducts();
    });
  };

  selectProduct = (sku: string) => {
    const { fieldType } = this.props.sdk.parameters.invocation as Record<string, unknown>;
    const onlyOneProductCanBeSelected = fieldType === 'Symbol';

    if (this.state.selectedSKUs.includes(sku)) {
      this.setState(
        ({ selectedSKUs }) => ({
          selectedSKUs: selectedSKUs.filter((productSku) => productSku !== sku),
        }),
        () => this.updateSelectedProducts()
      );
    } else {
      this.setState(
        ({ selectedSKUs }) => ({
          selectedSKUs: onlyOneProductCanBeSelected ? [sku] : [...selectedSKUs, sku],
        }),
        () => this.updateSelectedProducts()
      );
    }
  };

  constructSearchAdditionalInfo = (
    makeSearchHelpText: MakeSearchHelpText | undefined,
    skuType: string | undefined,
    paginationTotal: number
  ) => {
    const helpText = makeSearchHelpText ? makeSearchHelpText(skuType) : '';
    const totalResults = !!paginationTotal
      ? `${paginationTotal.toLocaleString()} total results`
      : '';

    if (helpText && totalResults) {
      return (
        <Flex justifyContent="space-between">
          <Text marginRight="spacingXl" className={styles.helpText}>
            {helpText}
          </Text>
          <Text className={styles.helpText}>{totalResults}</Text>
        </Flex>
      );
    } else {
      return <Text className={styles.helpText}>{helpText || totalResults}</Text>;
    }
  };

  render() {
    const { search, pagination, products, selectedProducts, selectedSKUs, searchBySku } =
      this.state;
    const {
      makeSaveBtnText = defaultGetSaveBtnText,
      makeSearchPlaceholderText = defaultMakeSearchPlaceholderText,
      makeSearchHelpText,
      skuType,
      hideSearch = false,
      showSearchBySkuOption,
    } = this.props;
    const infiniteScrollingPaginationMode = 'hasNextPage' in pagination;
    const pageCount = Math.ceil(pagination.total / pagination.limit);

    return (
      <>
        <header className={styles.header}>
          <div>
            {!hideSearch && (
              <div className={styles.searchWrapper}>
                <div className={styles.leftSideControls}>
                  <TextInput
                    placeholder={makeSearchPlaceholderText(skuType)}
                    type="search"
                    name="sku-search"
                    id="sku-search"
                    testId="sku-search"
                    value={search}
                    onChange={(event) => this.setSearch((event.target as HTMLInputElement).value)}
                  />
                  <SearchIcon variant="muted" />
                  {this.constructSearchAdditionalInfo(
                    makeSearchHelpText,
                    skuType,
                    pagination.total
                  )}
                </div>

                {showSearchBySkuOption && (
                  <div className={styles.skuSearch}>
                    <Checkbox
                      name="search-by-sku"
                      testId="search-by-sku"
                      id="search-by-sku"
                      isChecked={searchBySku}
                      onChange={() => this.setSearchBySku()}>
                      Search only by SKU
                    </Checkbox>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.rightSideControls}>
            <ProductSelectionList products={selectedProducts} selectProduct={this.selectProduct} />
            <Button
              className={styles.saveBtn}
              variant="primary"
              onClick={() => this.props.sdk.close(selectedSKUs)}
              isDisabled={selectedSKUs.length === 0}>
              {makeSaveBtnText(selectedSKUs, skuType)}
            </Button>
          </div>
        </header>
        <section className={styles.body}>
          <ProductList
            products={products}
            selectProduct={this.selectProduct}
            selectedSKUs={selectedSKUs}
          />
          {!infiniteScrollingPaginationMode && products.length > 0 && (
            <Paginator
              activePage={this.state.activePage}
              className={styles.paginator}
              pageCount={pageCount}
              setActivePage={this.setActivePage}
            />
          )}
          {infiniteScrollingPaginationMode && pagination.hasNextPage && (
            <Button
              className={styles.loadMoreButton}
              variant="transparent"
              testId="infinite-scrolling-pagination"
              onClick={this.loadMoreProducts}
              isFullWidth>
              Load more
            </Button>
          )}
        </section>
      </>
    );
  }
}
