import * as React from 'react';
import { render } from '@testing-library/react';
import { MetaDataRenderer } from './MetaDataRenderer';

describe('A MetaDataRenderer', () => {
  it('can render columns with titles', () => {
    const { getByRole } = render(
      <MetaDataRenderer columns={[{ title: 'hello world', rows: [] }]} />
    );
    const title = getByRole('heading');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('hello world');
  });

  it('can render columns content', () => {
    const { getAllByRole } = render(
      <MetaDataRenderer
        columns={[
          {
            title: 'hello world',
            rows: [
              { name: 'first-name', value: 'first-value' },
              { name: 'second-name', value: 'second-value' },
            ],
          },
        ]}
      />
    );

    expect(getAllByRole('listItem')).toHaveLength(2);
  });
});
