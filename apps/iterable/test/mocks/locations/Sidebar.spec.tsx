import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import Sidebar from '../../../src/locations/Sidebar';
import { defaultMockSdk } from '../mockSdk';

let mockSdk;
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockSdk = JSON.parse(JSON.stringify(defaultMockSdk)); // Deep clone for isolation
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the data feed link and enables copy when all values are present', () => {
    render(<Sidebar />);
    expect(screen.getByText('Data feed link')).toBeTruthy();
    expect(
      screen.getByDisplayValue(
        /https:\/\/cdn\.contentful\.com\/spaces\/space-id\/environments\/master\/entries/
      )
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /copy/i })).not.toHaveProperty('disabled', true);
    expect(screen.queryByText('Link generation error')).toBeFalsy();
  });

  it('shows error and disables copy when API key is missing', () => {
    mockSdk.parameters.installation.contentfulApiKey = '';
    render(<Sidebar />);
    expect(screen.getByText('Link generation error')).toBeTruthy();
    expect(screen.getByRole('button', { name: /copy/i })).toHaveProperty('disabled', true);
  });

  it('shows error and disables copy when space is missing', () => {
    mockSdk.ids.space = '';
    render(<Sidebar />);
    expect(screen.getByText('Link generation error')).toBeTruthy();
    expect(screen.getByRole('button', { name: /copy/i })).toHaveProperty('disabled', true);
  });

  it('shows error and disables copy when entryId is missing', () => {
    mockSdk.ids.entry = '';
    render(<Sidebar />);
    expect(screen.getByText('Link generation error')).toBeTruthy();
    expect(screen.getByRole('button', { name: /copy/i })).toHaveProperty('disabled', true);
  });
  it('includes &locale=* in the link when multiple locales are available', () => {
    mockSdk = {
      ...mockSdk,
      locales: {
        available: ['en-US', 'fr-FR'],
      },
    };
    render(<Sidebar />);
    const input = screen.getByDisplayValue(
      /https:\/\/cdn\.contentful\.com\/spaces\/space-id\/environments\/master\/entries\/entry-id\?access_token=.+&locale=\*/
    );
    expect(input).toBeTruthy();
  });
});
