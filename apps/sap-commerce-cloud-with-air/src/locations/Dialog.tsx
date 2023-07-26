import { useState, useEffect } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import { css } from '@emotion/css';
import get from 'lodash/get';
import union from 'lodash/union';
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
import { ProductList } from '../components/Dialog/ProductList';
import { useGetProductList } from '../hooks/useGetProductList';

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

export default function Dialog() {
  const sdk = useSDK<DialogAppSDK>();
  const [baseSite, setBaseSite] = useState<string>('');
  const [baseSites, setBaseSites] = useState<string[]>([]);
  const [query, setQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages] = useState<number>(0);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [errors] = useState([]);
  const { invocation, installation } = sdk.parameters;
  const { products, loading } = useGetProductList(query, page);

  const isFieldTypeArray = (get(invocation, 'fieldType', '') as string) === 'Array';

  useEffect(() => {
    const { baseSites } = installation;
    setBaseSite(baseSites);
    setBaseSites([baseSites]);
  }, [installation]);

  const selectMultipleProductsClickEvent = () => {
    const currentField = get(sdk.parameters.invocation, 'fieldValue', [] as string[]);
    const updatedField = union(currentField, selectedProducts);

    sdk.close(updatedField);
  };

  const multiProductsCheckBoxClickEvent = (event: any) => {
    let existingProducts: string[] = selectedProducts;
    const skuId: string = event.target.id;

    if (event.target.checked) {
      if (!existingProducts.includes(skuId)) {
        const apiEndpoint = get(sdk.parameters.invocation, 'apiEndpoint', '');
        existingProducts.push(`${apiEndpoint}/occ/v2/${baseSite}/products/${skuId}`);

        setSelectedProducts(existingProducts);
      }
    } else {
      if (existingProducts.includes(skuId)) {
        const skuIndex = existingProducts.indexOf(skuId);
        existingProducts.splice(skuIndex, 1);
        setSelectedProducts(existingProducts);
      }
    }
  };

  const prevPageButtonEvent = () => {
    setPage(page - 1);
  };

  const nextPageButtonEvent = () => {
    setPage(page - 1);
  };

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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(event) => {
                // if (event.key === 'Enter') {
                //   this.load();
                // }
              }}
            />
          </div>
          <div style={{ marginLeft: '10px', marginTop: '10px' }}>
            <Select onChange={(e) => setBaseSite(e.target.value)}>
              {baseSites.map((baseSite) => (
                <Option key={baseSite} value={baseSite}>
                  {baseSite}
                </Option>
              ))}
            </Select>
          </div>
          <div style={{ marginLeft: '10px', marginTop: '10px' }}>
            {/* TODO: fix search noop to work with load */}
            <Button variant="primary" startIcon={<SearchIcon />} onClick={() => {}}>
              Search
            </Button>
          </div>
        </div>
        {isFieldTypeArray ? (
          <div style={{ marginLeft: '10px', marginTop: '10px' }}>
            <Button variant="primary" onClick={selectMultipleProductsClickEvent}>
              Select Products
            </Button>
          </div>
        ) : (
          <></>
        )}
      </header>

      <Table style={{ padding: '20px' }}>
        {errors?.length ? (
          <TableBody>
            <TableRow>
              {errors.map((error: Error | any) => (
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
        {!products?.length || loading ? (
          <>Loading...</>
        ) : (
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
      <div style={{ margin: '20px' }}>
        {page > 0 ? (
          <Button variant="primary" onClick={prevPageButtonEvent}>
            Previous
          </Button>
        ) : (
          <></>
        )}
        {page + 1 < totalPages ? (
          <Button variant="primary" style={{ marginLeft: '20px' }} onClick={nextPageButtonEvent}>
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
            onClick={selectMultipleProductsClickEvent}
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
