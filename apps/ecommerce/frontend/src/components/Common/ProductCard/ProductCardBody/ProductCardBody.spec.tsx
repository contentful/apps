import ProductCardBody from './ProductCardBody';
import { render, screen } from '@testing-library/react';
import { externalResource } from '../../../../../test/mocks';

const { getByText, getByTestId, queryByTestId } = screen;

describe('ProductCardBody component', () => {
  it('mounts', () => {
    const { title, description, id, image } = externalResource;
    render(<ProductCardBody title={title} description={description} id={id} image={image} />);

    const mainBody = getByTestId('main-product-card-body');
    const titleElement = getByText(title!);
    const descriptionElement = getByText(description!);
    const idElement = getByText(id!);
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
    render(<ProductCardBody error={externalResourceError} />);

    const mainBody = queryByTestId('main-product-card-body');
    const errorMessage = getByText('Resource is missing or inaccessible');

    expect(mainBody).toBeFalsy();
    expect(errorMessage).toBeVisible();
  });
});
