import React from 'react';
import {
  Button,
  Option,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextInput,
} from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';
import tokens from '@contentful/forma-36-tokens';
import { ProductList } from './Dialog/ProductList';
import { fetchProductList } from '../api/fetchProductList';
import { fetchBaseSites } from '../api/fetchBaseSites';
import { Error, Product } from '../interfaces';
import get from 'lodash/get';
import union from 'lodash/union';
import { PlainClientAPI } from 'contentful-management/dist/typings/plain/common-types';
import { css } from '@emotion/css';

interface DialogProps {
  sdk: any;
  cma: PlainClientAPI;
  applicationInterfaceKey: string;
}

interface State {
  baseSite: string;
  baseSites: string[];
  query: string;
  page: number;
  totalPages: number;
  products: Product[];
  selectedProducts: string[];
  errors: Error[];
}

const styles = {
  header: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: tokens.spacingL,
    leftsideControls: css({
      position: 'relative',
      zIndex: 0,
      svg: css({
        zIndex: 1,
        position: 'absolute',
        top: '10px',
        left: '10px',
      }),
      input: css({
        paddingLeft: '35px',
      }),
    }),
  }),
};
export default class DialogClass extends React.Component<DialogProps, State> {
  state: State = {
    baseSite: '',
    baseSites: [],
    query: '',
    page: 0,
    totalPages: 0,
    products: [],
    selectedProducts: [],
    errors: [],
  };

  componentDidMount() {
    this.loadBaseSites().then(() => {
      this.load();
    });
  }

  load = async () => {
    const { products, errors } = await fetchProductList(
      this.state.baseSite,
      this.state.query,
      this.state.page,
      this.props.sdk.parameters as any,
      this.updateTotalPages,
      this.props.applicationInterfaceKey,
      this.props.sdk,
      this.props.cma
    );
    this.setState({
      baseSite: this.state.baseSite,
      baseSites: this.state.baseSites,
      query: this.state.query,
      products: products,
      selectedProducts: this.state.selectedProducts,
      errors: errors,
    });
  };

  loadBaseSites = async () => {
    const baseSites = await fetchBaseSites(
      this.props.sdk.parameters as any,
      this.props.applicationInterfaceKey,
      this.props.sdk,
      this.props.cma
    );
    let finalBaseSites: string[] = [];
    const installationConfigBaseSites = get(this.props.sdk.parameters.invocation, 'baseSites', '');
    if (installationConfigBaseSites.length > 0) {
      for (const baseSite of baseSites) {
        if (installationConfigBaseSites.split(',').includes(baseSite)) {
          finalBaseSites.push(baseSite);
        }
      }
    } else {
      finalBaseSites = baseSites;
    }
    this.setState({
      baseSite: finalBaseSites[0],
      baseSites: finalBaseSites,
      query: this.state.query,
      page: this.state.page,
      products: [],
      selectedProducts: [],
    });
  };

  updateSearchTerm = (event: any) => {
    this.setState({
      ...this.state,
      query: event.target.value,
    });
  };

  updateBaseSite = (event: any) => {
    this.setState(
      {
        ...this.state,
        baseSite: event.target.value,
      },
      () => {
        this.load();
      }
    );
  };

  multiProductsCheckBoxClickEvent = (event: any) => {
    let existingProducts: string[] = this.state.selectedProducts;
    const skuId: string = event.target.id;

    if (event.target.checked) {
      if (!existingProducts.includes(skuId)) {
        const apiEndpoint = get(this.props.sdk.parameters.invocation, 'apiEndpoint', '');
        existingProducts.push(`${apiEndpoint}/occ/v2/${this.state.baseSite}/products/${skuId}`);
        this.setState({
          selectedProducts: existingProducts,
        });
      }
    } else {
      if (existingProducts.includes(skuId)) {
        const skuIndex = existingProducts.indexOf(skuId);
        existingProducts.splice(skuIndex, 1);
        this.setState({
          selectedProducts: existingProducts,
        });
      }
    }
  };

  updateTotalPages = (totalPages: number) => {
    this.setState({ totalPages: this.state.totalPages });
  };

  selectMultipleProductsClickEvent = () => {
    const currentField = get(this.props.sdk.parameters.invocation, 'fieldValue', [] as string[]);
    const updatedField = union(currentField, this.state.selectedProducts);

    this.props.sdk.close(updatedField);
  };

  searchButtonClickEvent() {
    this.load();
  }

  nextPageButtonEvent = () => {
    this.setState({ page: this.state.page - 1 });
    this.load();
  };

  prevPageButtonEvent = () => {
    this.setState({ page: this.state.page - 1 });
    this.load();
  };

  render() {
    const isFieldTypeArray =
      (get(this.props.sdk.parameters.invocation, 'fieldType', '') as string) === 'Array';

    return (
      <>
        <header className={styles.header}>
          <div style={{ display: 'flex' }}>
            <div style={{ marginLeft: '10px', marginTop: '10px' }}>
              <TextInput
                type="text"
                placeholder={'Search Term...'}
                className="f36-margin-bottom--m"
                style={{ width: '250px' }}
                value={this.state.query}
                onChange={this.updateSearchTerm}
                onKeyPress={(event) => {
                  if (event.key === 'Enter') {
                    this.load();
                  }
                }}
              />
            </div>
            <div style={{ marginLeft: '10px', marginTop: '10px' }}>
              <Select onChange={this.updateBaseSite}>
                {this.state.baseSites.map((baseSite) => (
                  <Option key={baseSite} value={baseSite}>
                    {baseSite}
                  </Option>
                ))}
              </Select>
            </div>
            <div style={{ marginLeft: '10px', marginTop: '10px' }}>
              <Button
                variant="primary"
                startIcon={<SearchIcon />}
                onClick={() => this.searchButtonClickEvent()}>
                Search
              </Button>
            </div>
          </div>
          {isFieldTypeArray ? (
            <div style={{ marginLeft: '10px', marginTop: '10px' }}>
              <Button variant="primary" onClick={this.selectMultipleProductsClickEvent}>
                Select Products
              </Button>
            </div>
          ) : (
            <></>
          )}
        </header>

        <Table style={{ padding: '20px' }}>
          {this.state.errors?.length ? (
            <TableBody>
              <TableRow>
                {this.state.errors.map((error) => (
                  <TableCell key={error.message}>
                    {' '}
                    {error.type} : {error.message}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          ) : (
            <></>
          )}
          {this.state.products?.length ? (
            <>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '10%' }}>Select</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Image</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <ProductList
                  sdk={this.props.sdk}
                  products={this.state.products}
                  baseSite={this.state.baseSite}
                  selectedProducts={this.state.selectedProducts}
                  checkboxFn={this.multiProductsCheckBoxClickEvent}
                />
              </TableBody>
            </>
          ) : (
            <></>
          )}
        </Table>
        <div style={{ margin: '20px' }}>
          {this.state.page > 0 ? (
            <Button variant="primary" onClick={this.prevPageButtonEvent}>
              Previous
            </Button>
          ) : (
            <></>
          )}
          {this.state.page + 1 < this.state.totalPages ? (
            <Button
              variant="primary"
              style={{ marginLeft: '20px' }}
              onClick={this.nextPageButtonEvent}>
              Next
            </Button>
          ) : (
            <></>
          )}
        </div>
        {isFieldTypeArray ? (
          <div>
            <Button
              variant="primary"
              onClick={this.selectMultipleProductsClickEvent}
              style={{ margin: '20px' }}>
              Select Products
            </Button>
          </div>
        ) : (
          <></>
        )}
      </>
    );
  }
}
