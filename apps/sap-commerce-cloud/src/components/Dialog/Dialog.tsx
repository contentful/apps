import React from 'react';
import {
  Button,
  Grid,
  GridItem,
  IconButton,
  Option,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextInput,
} from '@contentful/f36-components';
import { DialogAppSDK } from '@contentful/app-sdk';
import { ProductList } from './ProductList';
import { fetchProductList } from '../../api/fetchProductList';
import { fetchBaseSites } from '../../api/fetchBaseSites';
import { AppParameters, Error, Product, SAPParameters } from '../../interfaces';
import get from 'lodash/get';
import union from 'lodash/union';
import { formatProductUrl } from '../../utils';
import { styles } from './Dialog.styles';
import { cx } from '@emotion/css';
import { DoneIcon, SearchIcon } from '@contentful/f36-icons';

interface DialogProps {
  sdk: DialogAppSDK<AppParameters>;
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

export default class Dialog extends React.Component<DialogProps, State> {
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
      this.props.sdk.parameters as SAPParameters,
      this.updateTotalPages
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
    const baseSites = await fetchBaseSites(this.props.sdk.parameters as SAPParameters);
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
        existingProducts.push(formatProductUrl(apiEndpoint, this.state.baseSite, skuId));
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
    this.setState({ totalPages });
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
    this.setState({ page: this.state.page + 1 }, this.load);
  };

  prevPageButtonEvent = () => {
    this.setState({ page: this.state.page - 1 }, this.load);
  };

  render() {
    const isFieldTypeArray =
      (get(this.props.sdk.parameters.invocation, 'fieldType', '') as string) === 'Array';
    return (
      <>
        <Grid
          columns="1fr 1fr 1fr 1fr 1fr"
          rowGap="spacingM"
          columnGap="spacingM"
          className={styles.grid}>
          <GridItem>
            <TextInput
              type="text"
              placeholder={'Search Term...'}
              className={cx(styles.textInput, 'f36-margin-bottom--m')}
              value={this.state.query}
              onChange={this.updateSearchTerm}
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  this.load();
                }
              }}
            />
          </GridItem>
          <GridItem>
            <Select onChange={this.updateBaseSite}>
              {this.state.baseSites.map((baseSite) => (
                <Option key={baseSite} value={baseSite}>
                  {baseSite}
                </Option>
              ))}
            </Select>
          </GridItem>
          <GridItem>
            <IconButton
              variant="primary"
              icon={<SearchIcon />}
              aria-label="search"
              onClick={() => this.searchButtonClickEvent()}>
              Search
            </IconButton>
          </GridItem>
          {isFieldTypeArray ? (
            <GridItem>
              <IconButton
                variant="primary"
                icon={<DoneIcon />}
                onClick={this.selectMultipleProductsClickEvent}
                aria-label="Select Products">
                Select Products
              </IconButton>
            </GridItem>
          ) : (
            <></>
          )}
        </Grid>

        <Table className={styles.table}>
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
                  <TableCell className={styles.tableCell}>Select</TableCell>
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
        <div className={styles.pagination}>
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
              className={styles.nextButton(this.state.page)}
              onClick={this.nextPageButtonEvent}>
              Next
            </Button>
          ) : (
            <></>
          )}
        </div>
        {isFieldTypeArray ? (
          <IconButton
            variant="primary"
            icon={<DoneIcon />}
            onClick={this.selectMultipleProductsClickEvent}
            aria-label="Select Products"
            className={styles.selectProductsButton}>
            Select Products
          </IconButton>
        ) : (
          <></>
        )}
      </>
    );
  }
}
