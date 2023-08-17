import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ProductCardAdditionalData } from './ProductCardAdditionalData';

const { getByTestId } = screen;

describe('ProductCardRawData component', () => {
  it('mounts', () => {
    render(
      <ProductCardAdditionalData isExpanded={true}>
        {JSON.stringify('random JSON')}
      </ProductCardAdditionalData>
    );

    const collapse = getByTestId('cf-collapse');

    expect(collapse).toBeInTheDocument();
    expect(collapse).toHaveTextContent('random JSON');
  });
});
