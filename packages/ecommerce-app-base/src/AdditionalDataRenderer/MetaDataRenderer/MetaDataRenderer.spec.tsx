import * as React from 'react';
import { render } from '@testing-library/react';
import { MetaDataRenderer } from './MetaDataRenderer';

describe('A MetaDataRenderer', () => {
  it('can render columns with titles', () => {
    const { getByRole } = render(
      <MetaDataRenderer columns={[{ title: 'hello world', items: [] }]} />
    );
    const title = getByRole('heading');
    expect(title).toBeTruthy();
    expect(title.innerHTML).toBe('hello world');
  });

  it('can render columns content', () => {
    const { getAllByRole } = render(
      <MetaDataRenderer
        columns={[
          {
            title: 'hello world',
            items: [
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
