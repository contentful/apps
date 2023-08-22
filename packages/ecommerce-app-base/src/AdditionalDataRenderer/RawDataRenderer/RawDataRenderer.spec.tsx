import * as React from 'react';
import { render } from '@testing-library/react';
import { RawDataRenderer } from './RawDataRenderer';

const VALUE = { hello: 'world' };

describe('A RawDataRenderer', () => {
  it('provides a copy button', () => {
    const { getByRole } = render(<RawDataRenderer value={VALUE} />);
    const button = getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('displays a string representation of the data', () => {
    const { getByRole } = render(<RawDataRenderer value={VALUE} />);
    const code = getByRole('document');
    expect(code).toBeInTheDocument();
    expect(code).toHaveTextContent('{ "hello": "world" }');
  });
});
