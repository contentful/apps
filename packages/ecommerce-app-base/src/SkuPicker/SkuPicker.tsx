import React, { Component } from 'react';
import get from 'lodash/get';
import clamp from 'lodash/clamp';
import debounce from 'lodash/debounce';
import { DialogExtensionSDK } from '@contentful/app-sdk';
import { ProductList } from './ProductList';
import { Paginator } from './Paginator';
import {
  MakeSaveBtnTextFn,
  Pagination,
  Product,
  ProductPreviewsFn,
  ProductsFn,
} from '../interfaces';
import { ProductSelectionList } from './ProductSelectionList';
import { styles } from './styles';
import { mapSort } from '../utils';

import { Button, Icon, TextInput } from '@contentful/f36-components';

import { SearchIcon } from '@contentful/f36-icons';

export interface Props {
  sdk: DialogExtensionSDK;
  fetchProductPreviews: ProductPreviewsFn;
  fetchProducts: ProductsFn;
  searchDelay?: number;
  skuType?: string;
  makeSaveBtnText?: MakeSaveBtnTextFn;
  hideSearch?: boolean;
}

interface State {
  activePage: number;
  search: string;
  pagination: Pagination;
  products: Product[];
  selectedProducts: Product[];
  selectedSKUs: string[];
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

  updateProducts = async () => {
    try {
      const {
        activePage,
        pagination: { limit },
        search,
      } = this.state;
      const offset = (activePage - 1) * limit;
      const fetched = await this.props.fetchProducts(search, { offset });
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
    const { fieldType } = this.props.sdk.parameters.invocation as Record<string, any>;
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

  render() {
    const { search, pagination, products, selectedProducts, selectedSKUs } = this.state;
    const { makeSaveBtnText = defaultGetSaveBtnText, skuType, hideSearch = false } = this.props;
    const infiniteScrollingPaginationMode = 'hasNextPage' in pagination;
    const pageCount = Math.ceil(pagination.total / pagination.limit);

    return (
      <>
        <header className={styles.header}>
          <div className={styles.leftsideControls}>
            {!hideSearch && (
              <>
                <TextInput
                  placeholder="Search for a product..."
                  type="search"
                  name="sku-search"
                  id="sku-search"
                  testId="sku-search"
                  value={search}
                  onChange={(event) => this.setSearch((event.target as HTMLInputElement).value)}
                />
                <SearchIcon variant="muted" />
              </>
            )}
            {!!pagination.total && (
              <span className={styles.total}>
                Total results: {pagination.total.toLocaleString()}
              </span>
            )}
          </div>
          <div className={styles.rightsideControls}>
            <ProductSelectionList products={selectedProducts} selectProduct={this.selectProduct} />
            <Button
              className={styles.saveBtn}
              variant="primary"
              onClick={() => this.props.sdk.close(selectedSKUs)}
              isDisabled={selectedSKUs.length === 0}
            >
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
              isFullWidth
            >
              Load more
            </Button>
          )}
        </section>
      </>
    );
  }
}
