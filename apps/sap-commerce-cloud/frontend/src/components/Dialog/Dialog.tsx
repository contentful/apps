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
import { DoneIcon, SearchIcon } from '@contentful/f36-icons';

interface DialogProps {
  sdk: DialogAppSDK<AppParameters>;
}

const Dialog: React.FC<DialogProps> = ({ sdk }) => {
  const [baseSite, setBaseSite] = useState('');
  const [baseSites, setBaseSites] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [errors, setErrors] = useState<ErrorType[]>([]);

  const load = useCallback(() => {
    const load = async () => {
      const { products, errors } = await fetchProductList(
        baseSite,
        query,
        page,
        sdk.parameters as SAPParameters,
        setTotalPages
      );
      setProducts(products);
      setErrors(errors);
    };
    return load;
  }, [baseSite, query, page, sdk.parameters]);

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
    const initialize = async () => {
      await loadBaseSites();
      load();
    };
    initialize();
  }, [load, sdk.parameters]);

  const updateSearchTerm = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const updateBaseSite = (event: ChangeEvent<HTMLSelectElement>) => {
    setBaseSite(event.target.value);
    load();
  };

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

  const searchButtonClickEvent = () => {
    load();
  };

  const nextPageButtonEvent = () => {
    setPage((prevPage) => prevPage + 1);
    load();
  };

  const prevPageButtonEvent = () => {
    setPage((prevPage) => prevPage - 1);
    load();
  };

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
            placeholder={'Search Term...'}
            className={cx(styles.textInput, 'f36-margin-bottom--m')}
            value={query}
            onChange={updateSearchTerm}
            onKeyPress={(event) => {
              if (event.key === 'Enter') {
                load();
              }
            }}
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
        <GridItem>
          <IconButton
            variant="primary"
            icon={<SearchIcon />}
            aria-label="search"
            onClick={searchButtonClickEvent}>
            Search
          </IconButton>
        </GridItem>
        {isFieldTypeArray && (
          <GridItem>
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
          <Button variant="primary" onClick={prevPageButtonEvent}>
            Previous
          </Button>
        )}
        {page + 1 < totalPages && (
          <Button
            variant="primary"
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
