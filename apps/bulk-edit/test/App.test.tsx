import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import App from '../src/App';
import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

// Mock the Page component
vi.mock('../src/locations/Page', () => ({
  default: () => <div data-test-id="mock-page">Mock Page Component</div>,
}));

// Mock useSDK
const mockUseSDK = vi.fn();
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockUseSDK(),
}));

describe('App', () => {
  it('renders the Page component when location is LOCATION_PAGE', () => {
    mockUseSDK.mockReturnValue({
      location: {
        is: (location: string) => location === locations.LOCATION_PAGE,
      },
    });
    render(<App />);
    expect(screen.getByTestId('mock-page')).toBeTruthy();
  });

  it('renders null when location is not LOCATION_PAGE', () => {
    mockUseSDK.mockReturnValue({
      location: {
        is: () => false,
      },
    });
    const { container } = render(<App />);
    expect(container.firstChild).toBeNull();
  });
});
