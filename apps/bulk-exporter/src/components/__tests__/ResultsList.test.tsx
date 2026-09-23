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
