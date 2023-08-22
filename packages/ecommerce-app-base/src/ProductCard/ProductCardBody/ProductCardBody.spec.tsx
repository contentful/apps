import * as React from 'react';
import ProductCardBody from './ProductCardBody';
import { cleanup, render, screen } from '@testing-library/react';
import { productsList } from '../../__mocks__';

const { getByText, getByTestId, queryByTestId } = screen;

describe('ProductCardBody component', () => {
  afterEach(cleanup);

  it('mounts', () => {
    const { name, description, id, image } = productsList[0];
    render(<ProductCardBody title={name} description={description} id={id} image={image} />);

    const mainBody = getByTestId('main-product-card-body');
    const titleElement = getByText(name!);
    const descriptionElement = getByText(
      'Open your door to the world of grilling with the sleek Spirit II E-210...'
    );
    const idElement = getByText(id);
    const imageElement = document.querySelector('img');

    expect(mainBody).toBeVisible();
    expect(titleElement).toBeVisible();
    expect(descriptionElement).toBeVisible();
    expect(idElement).toBeVisible();
    expect(imageElement?.getAttribute('src')).toBe(image);
  });

  it('mounts in error state', () => {
    const externalResourceError = {
      error: 'Something happened',
      errorMessage: 'Internal Server Error',
      errorStatus: 401,
    };
    render(<ProductCardBody externalResourceError={externalResourceError} />);

    const mainBody = queryByTestId('main-product-card-body');
    const errorMessage = getByText('Resource is missing or inaccessible');

    expect(mainBody).toBeFalsy();
    expect(errorMessage).toBeVisible();
  });
});
