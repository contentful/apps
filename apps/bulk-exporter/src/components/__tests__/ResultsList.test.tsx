import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ResultsList } from '../ResultsList';
import type { ContentType } from '../../lib/flatten';

const mockContentType: ContentType = {
  sys: { id: 'blogPost' },
  name: 'Blog Post',
  displayField: 'title',
  fields: [
    { id: 'title', name: 'Title', type: 'Symbol', localized: false },
    { id: 'body', name: 'Body', type: 'Text', localized: false },
  ],
};

const mockResults = [
  {
    sys: {
      id: 'entry1',
      contentType: { sys: { id: 'blogPost' } },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      publishedVersion: 1,
    },
    fields: {
      title: { 'en-US': 'Hello World' },
      body: { 'en-US': 'Some body text' },
    },
  },
];

describe('ResultsList result count', () => {
  it('shows the exact count in the header and select-all banner', async () => {
    render(
      <ResultsList
        results={mockResults}
        loading={false}
        totalCount={1234}
        itemsPerPage={1}
        selectedIds={['entry1']}
        onSelectionChange={vi.fn()}
        onSelectAllMatchingChange={vi.fn()}
      />
    );

    expect(screen.getByText('1,234 results')).toBeInTheDocument();
    expect(screen.getByText(/Select all 1,234 entries matching this search/)).toBeInTheDocument();
    expect(screen.queryByText(/Up to/)).not.toBeInTheDocument();
  });

  it('labels the header and select-all action as upper bounds when the scan cap was hit', async () => {
    render(
      <ResultsList
        results={mockResults}
        loading={false}
        totalCount={12000}
        isCountUpperBound
        itemsPerPage={1}
        selectedIds={['entry1']}
        onSelectionChange={vi.fn()}
        onSelectAllMatchingChange={vi.fn()}
      />
    );

    expect(screen.getByText('Up to 12,000 results')).toBeInTheDocument();
    expect(
      screen.getByText('Select all entries matching this search (up to 12,000)')
    ).toBeInTheDocument();
  });

  it('does not claim an exact selected count when the scan cap was hit', () => {
    render(
      <ResultsList
        results={mockResults}
        loading={false}
        totalCount={12000}
        isCountUpperBound
        selectAllMatching
      />
    );

    expect(screen.getByText(/All entries matching this search are selected/)).toBeInTheDocument();
    expect(screen.queryByText(/All 12,000 entries matching this search/)).not.toBeInTheDocument();
  });
});

describe('ResultsList field selection', () => {
  it('renders one checked checkbox per field column when excludedFieldIds is empty', () => {
    render(
      <ResultsList
        results={mockResults}
        loading={false}
        contentTypeSchema={mockContentType}
        excludedFieldIds={[]}
        onExcludedFieldIdsChange={vi.fn()}
        locales={['en-US']}
      />
    );

    const titleCheckbox = screen.getByRole('checkbox', { name: 'Include Title in export' });
    const bodyCheckbox = screen.getByRole('checkbox', { name: 'Include Body in export' });
    expect(titleCheckbox).toBeChecked();
    expect(bodyCheckbox).toBeChecked();
  });

  it('calls onExcludedFieldIdsChange with the field id when its checkbox is clicked', async () => {
    const onExcludedFieldIdsChange = vi.fn();
    render(
      <ResultsList
        results={mockResults}
        loading={false}
        contentTypeSchema={mockContentType}
        excludedFieldIds={[]}
        onExcludedFieldIdsChange={onExcludedFieldIdsChange}
        locales={['en-US']}
      />
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Include Title in export' }));

    expect(onExcludedFieldIdsChange).toHaveBeenCalledWith(['title']);
  });

  it('still renders an excluded field column, unchecked, with header and body cells visible', () => {
    render(
      <ResultsList
        results={mockResults}
        loading={false}
        contentTypeSchema={mockContentType}
        excludedFieldIds={['body']}
        onExcludedFieldIdsChange={vi.fn()}
        locales={['en-US']}
      />
    );

    const bodyCheckbox = screen.getByRole('checkbox', { name: 'Include Body in export' });
    expect(bodyCheckbox).not.toBeChecked();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Some body text')).toBeInTheDocument();
  });
});
