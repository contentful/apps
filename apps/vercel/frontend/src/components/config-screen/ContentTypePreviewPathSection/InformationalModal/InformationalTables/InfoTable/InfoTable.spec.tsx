import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InfoTable } from './InfoTable';

describe('InfoTable', () => {
  it('renders content', () => {
    const headers = ['header1', 'header2'];
    const rows = [
      { example: <div>example1</div>, description: 'description1' },
      { example: <div>example2</div>, description: 'description2' },
    ];
    render(<InfoTable headers={headers} rows={rows} />);

    const tableHeaders = screen.getByTestId('info-table-headers');
    const tableRows = screen.getAllByTestId('info-table-row');

    expect(tableHeaders).toBeTruthy();
    expect(tableRows).toHaveLength(2);
  });
});
