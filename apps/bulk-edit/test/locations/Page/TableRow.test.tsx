import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TableRow } from '../../../src/locations/Page/components/TableRow';
import { Entry, ContentTypeField } from '../../../src/locations/Page/types';
import { ContentTypeProps } from 'contentful-management';

const mockFields: ContentTypeField[] = [
  { id: 'displayName', uniqueId: 'displayName', name: 'Display Name', type: 'Symbol' },
  { id: 'description', uniqueId: 'description', name: 'Description', type: 'Text' },
];

const mockEntry: Entry = {
  sys: {
    id: 'entry-1',
    contentType: { sys: { id: 'building' } },
    publishedVersion: 1,
    version: 1,
  },
  fields: {
    displayName: { 'en-US': 'Building one' },
    description: { 'en-US': 'Description one' },
  },
};

const mockContentType: ContentTypeProps = {
  sys: { id: 'building' },
  name: 'Building',
  displayField: 'displayName',
} as ContentTypeProps;

describe('TableRow', () => {
  const defaultProps = {
    entry: mockEntry,
    fields: mockFields,
    contentType: mockContentType,
    spaceId: 'space-1',
    environmentId: 'env-1',
    defaultLocale: 'en-US',
    rowCheckboxes: {},
    onCellCheckboxChange: () => {},
    cellCheckboxesDisabled: {},
  };

  it('renders the entry data correctly', () => {
    render(<TableRow {...defaultProps} />);

    expect(screen.getByTestId('entry-link')).toHaveTextContent('Building one');
    expect(screen.getByText('Description one')).toBeInTheDocument();
  });

  it('renders the status badge', () => {
    render(<TableRow {...defaultProps} />);

    const statusBadge = screen.getByText('Unknown');
    expect(statusBadge).toBeInTheDocument();
  });

  it('applies focused styling when badge is focused', () => {
    render(<TableRow {...defaultProps} />);

    const statusBadge = screen.getByTestId('cf-ui-badge');

    // Focus the badge
    fireEvent.focus(statusBadge);

    // Check that the badge has the focused styling
    expect(statusBadge).toHaveStyle('border: 2px solid rgb(152, 203, 255)'); // blue300 color
  });

  it('removes focused styling when badge loses focus', () => {
    render(<TableRow {...defaultProps} />);

    const statusBadge = screen.getByTestId('cf-ui-badge');

    // Focus the badge
    fireEvent.focus(statusBadge);
    expect(statusBadge).toHaveStyle('border: 2px solid rgb(152, 203, 255)');

    // Blur the badge
    fireEvent.blur(statusBadge);
    expect(statusBadge).not.toHaveStyle('border: 2px solid rgb(152, 203, 255)');
  });

  it('makes the badge focusable with tabIndex', () => {
    render(<TableRow {...defaultProps} />);

    const statusBadge = screen.getByTestId('cf-ui-badge');
    expect(statusBadge).toHaveAttribute('tabIndex', '0');
  });
});
