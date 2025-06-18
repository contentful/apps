import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSdk } from '../mocks';
import ConfigScreen from '../../src/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Config Screen component (Hubspot)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    render(<ConfigScreen />);
  });

  afterEach(() => {
    cleanup();
  });

  describe('components', () => {
    it('renders the main heading and description', () => {
      expect(screen.getByRole('heading', { name: /Set up Hubspot/i })).toBeTruthy();
      expect(
        screen.getByText(/Seamlessly sync Contentful entry content to email campaigns in Hubspot/i)
      ).toBeTruthy();
    });

    it('renders the Configure access section and input', () => {
      expect(screen.getByText(/Configure access/i)).toBeTruthy();
      expect(
        screen.getByText(
          /To connect your organization's Hubspot account, enter the private app access token/i
        )
      ).toBeTruthy();
      expect(screen.getByLabelText(/Private app access token/i)).toBeTruthy();
      expect(screen.getByPlaceholderText(/Enter your access token/i)).toBeTruthy();
    });

    it('shows the input as required', () => {
      const input = screen.getByPlaceholderText(/Enter your access token/i);
      expect(input).toBeRequired();
    });
    /*
    it('shows validation message if token is invalid', async () => {
      const input = screen.getByPlaceholderText(/Enter your access token/i);
      fireEvent.change(input, { target: { value: '' } });
      // Wait for the validation message to appear
      expect(await screen.findByText(/Invalid API key/i)).toBeTruthy();
    });

    it('renders the instructions section and can expand/collapse', () => {
      expect(
        screen.getByText(/Instructions to create a private app access token in Hubspot/i)
      ).toBeTruthy();
      // Should be expanded by default
      expect(screen.getByText(/To create a private app access token:/i)).toBeTruthy();
      // Collapse
      const toggleBtn = screen.getByLabelText(/Collapse instructions|Expand instructions/i);
      fireEvent.click(toggleBtn);
      expect(screen.queryByText(/To create a private app access token:/i)).toBeFalsy();
      // Expand again
      fireEvent.click(toggleBtn);
      expect(screen.getByText(/To create a private app access token:/i)).toBeTruthy();
    });*/

    it('renders the external link with icon', () => {
      const link = screen.getByRole('link', {
        name: /Read about creating private apps in Hubspot/i,
      });
      expect(link).toBeTruthy();
      expect(link).toHaveAttribute('href');
      expect(link.querySelector('svg')).toBeTruthy();
    });
  });
});
