import { useEffect, useState, ChangeEvent, useCallback } from 'react';
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
import { AppParameters, Error as ErrorType, Product, SAPParameters } from '../../interfaces';
import get from 'lodash/get';
import union from 'lodash/union';
import { formatProductUrl } from '../../utils';
import { styles } from './Dialog.styles';
import { cx } from '@emotion/css';
import { DoneIcon } from '@contentful/f36-icons';
import { useDebounce } from 'use-debounce';

interface DialogProps {
  sdk: DialogAppSDK<AppParameters>;
}

const Dialog: React.FC<DialogProps> = ({ sdk }) => {
  const [baseSite, setBaseSite] = useState('');
  const [baseSites, setBaseSites] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [errors, setErrors] = useState<ErrorType[]>([]);

  const load = useCallback(async () => {
    const { products, errors } = await fetchProductList(
      baseSite,
      debouncedQuery,
      page,
      sdk.parameters as SAPParameters,
      setTotalPages
    );
    setProducts(products);
    setErrors(errors);
  }, [baseSite, debouncedQuery, page, sdk.parameters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const loadBaseSites = async () => {
      const baseSites = await fetchBaseSites(sdk.parameters as SAPParameters);
      const installationConfigBaseSites = `${get(sdk.parameters.invocation, 'baseSites', '')}`;
      let finalBaseSites: string[] = [];

      if (installationConfigBaseSites.length > 0) {
        finalBaseSites = baseSites.filter((site) =>
          installationConfigBaseSites.split(',').includes(site)
        );
      } else {
        finalBaseSites = baseSites;
      }

      setBaseSite(finalBaseSites[0]);
      setBaseSites(finalBaseSites);
      setProducts([]);
      setSelectedProducts([]);
    };

    loadBaseSites();
  }, [sdk.parameters]);

  const updateSearchTerm = (event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value);

  const updateBaseSite = (event: ChangeEvent<HTMLSelectElement>) => setBaseSite(event.target.value);

  const multiProductsCheckBoxClickEvent = (event: ChangeEvent<HTMLInputElement>) => {
    const skuId = event.target.id;
    let updatedProducts = [...selectedProducts];

    if (event.target.checked) {
      if (!updatedProducts.includes(skuId)) {
        const apiEndpoint = `${get(sdk.parameters.invocation, 'apiEndpoint', '')}`;
        updatedProducts.push(formatProductUrl(apiEndpoint, baseSite, skuId));
      }
    } else {
      updatedProducts = updatedProducts.filter((id) => id !== skuId);
    }

    setSelectedProducts(updatedProducts);
  };

  const selectMultipleProductsClickEvent = () => {
    const currentField = get(sdk.parameters.invocation, 'fieldValue', [] as string[]);
    if (!Array.isArray(currentField)) {
      sdk.close([]);
      return;
    }
    const updatedField = union(currentField, selectedProducts);

    sdk.close(updatedField);
  };

  const nextPageButtonEvent = () => setPage((prevPage) => prevPage + 1);

  const prevPageButtonEvent = () => setPage((prevPage) => prevPage - 1);

  const isFieldTypeArray = (get(sdk.parameters.invocation, 'fieldType', '') as string) === 'Array';

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
            aria-label="Search products"
            placeholder={'Type to search products'}
            className={cx(styles.textInput, 'f36-margin-bottom--m')}
            value={query}
            onChange={updateSearchTerm}
          />
        </GridItem>
        <GridItem>
          <Select onChange={updateBaseSite} value={baseSite}>
            {baseSites.map((site) => (
              <Option key={site} value={site}>
                {site}
              </Option>
            ))}
          </Select>
        </GridItem>
        {isFieldTypeArray && (
          <GridItem className={styles.selectButton}>
            <IconButton
              variant="primary"
              icon={<DoneIcon />}
              onClick={selectMultipleProductsClickEvent}
              aria-label="Select Products">
              Select Products
            </IconButton>
          </GridItem>
        )}
      </Grid>

      <Table className={styles.table}>
        {errors?.length > 0 && (
          <TableBody>
            <TableRow>
              {errors.map((error) => (
                <TableCell key={error.message}>
                  {error.type} : {error.message}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        )}
        {products?.length > 0 && (
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
                sdk={sdk}
                products={products}
                baseSite={baseSite}
                selectedProducts={selectedProducts}
                checkboxFn={multiProductsCheckBoxClickEvent}
              />
            </TableBody>
          </>
        )}
      </Table>
      <div className={styles.pagination}>
        {page > 0 && (
          <Button variant="primary" onClick={prevPageButtonEvent} aria-label="Previous page">
            Previous
          </Button>
        )}
        {page + 1 < totalPages && (
          <Button
            variant="primary"
            aria-label="Next page"
            className={styles.nextButton(page)}
            onClick={nextPageButtonEvent}>
            Next
          </Button>
        )}
      </div>
      {isFieldTypeArray && (
        <IconButton
          variant="primary"
          icon={<DoneIcon />}
          onClick={selectMultipleProductsClickEvent}
          aria-label="Select Products"
          className={styles.selectProductsButton}>
          Select Products
        </IconButton>
      )}
    </>
  );
};

export default Dialog;
