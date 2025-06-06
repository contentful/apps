import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EntryTable } from '../../../src/locations/Page/components/EntryTable';
import { Entry, ContentTypeField } from '../../../src/locations/Page/types';
import { ContentTypeProps } from 'contentful-management';

const mockFields: ContentTypeField[] = [
  { id: 'displayName', name: 'Display Name', type: 'Symbol' },
  { id: 'description', name: 'Description', type: 'Text' },
];

const mockEntries: Entry[] = [
  {
    sys: {
      id: 'entry-1',
      contentType: { sys: { id: 'building' } },
      publishedVersion: 1,
      version: 2,
    },
    fields: {
      displayName: { 'en-US': 'Building one' },
      description: { 'en-US': 'Description one' },
    },
  },
  {
    sys: {
      id: 'entry-2',
      contentType: { sys: { id: 'building' } },
      publishedVersion: 1,
      version: 2,
    },
    fields: {
      displayName: { 'en-US': 'Building two' },
      description: { 'en-US': 'Description two' },
    },
  },
];

const mockContentType: ContentTypeProps = {
  sys: { id: 'building' },
  name: 'Building',
  displayField: 'displayName',
  fields: mockFields,
} as ContentTypeProps;

describe('EntryTable', () => {
  it('renders all fields in the table header', () => {
    render(
      <EntryTable
        entries={mockEntries}
        fields={mockFields}
        contentType={mockContentType}
        spaceId="space-1"
        environmentId="env-1"
        locale="en-US"
        activePage={0}
        totalEntries={2}
        itemsPerPage={15}
        onPageChange={() => {}}
        onItemsPerPageChange={() => {}}
        pageSizeOptions={[15, 50, 100]}
      />
    );

    expect(screen.getByText('Display name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders entry data in the table cells', () => {
    render(
      <EntryTable
        entries={mockEntries}
        fields={mockFields}
        contentType={mockContentType}
        spaceId="space-1"
        environmentId="env-1"
        locale="en-US"
        activePage={0}
        totalEntries={2}
        itemsPerPage={15}
        onPageChange={() => {}}
        onItemsPerPageChange={() => {}}
        pageSizeOptions={[15, 50, 100]}
      />
    );

    // Use getAllByText for elements that appear multiple times
    const buildingOneLinks = screen.getAllByText('Building one');
    expect(buildingOneLinks).toHaveLength(2); // One in the link, one in the cell

    const buildingTwoLinks = screen.getAllByText('Building two');
    expect(buildingTwoLinks).toHaveLength(2); // One in the link, one in the cell

    expect(screen.getByText('Description one')).toBeInTheDocument();
    expect(screen.getByText('Description two')).toBeInTheDocument();
  });

  it('calls onPageChange when pagination is used', () => {
    const onPageChange = vi.fn();
    render(
      <EntryTable
        entries={mockEntries}
        fields={mockFields}
        contentType={mockContentType}
        spaceId="space-1"
        environmentId="env-1"
        locale="en-US"
        activePage={0}
        totalEntries={30}
        itemsPerPage={15}
        onPageChange={onPageChange}
        onItemsPerPageChange={() => {}}
        pageSizeOptions={[15, 50, 100]}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onItemsPerPageChange when page size is changed', () => {
    const onItemsPerPageChange = vi.fn();
    render(
      <EntryTable
        entries={mockEntries}
        fields={mockFields}
        contentType={mockContentType}
        spaceId="space-1"
        environmentId="env-1"
        locale="en-US"
        activePage={0}
        totalEntries={30}
        itemsPerPage={15}
        onPageChange={() => {}}
        onItemsPerPageChange={onItemsPerPageChange}
        pageSizeOptions={[15, 50, 100]}
      />
    );

    const pageSizeSelect = screen.getByTestId('cf-ui-select');
    fireEvent.change(pageSizeSelect, { target: { value: '50' } });
    expect(onItemsPerPageChange).toHaveBeenCalledWith(50);
  });
});
