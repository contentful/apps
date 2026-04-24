import React from 'react';
import { act, render } from '@testing-library/react';
import { vi } from 'vitest';
import { mockCma, mockSdk } from '../../__tests__/mocks';
import ConfigScreen from '@/components/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  beforeEach(() => {
    mockSdk.app.getParameters.mockResolvedValue(null);
  });

  it('renders config heading and all config fields', async () => {
    const { getByText, getByPlaceholderText } = render(<ConfigScreen />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByText('Link Checker')).toBeInTheDocument();
    expect(
      getByText(/Configure where Link Checker appears and which URL rules it should enforce/)
    ).toBeInTheDocument();
    expect(getByText('Configure access')).toBeInTheDocument();
    expect(getByText('Assign content types')).toBeInTheDocument();
    expect(getByText('Content types')).toBeInTheDocument();
    expect(getByText('Set up rules')).toBeInTheDocument();
    expect(getByText(/Current domain/)).toBeInTheDocument();
    expect(getByText(/Allow list/)).toBeInTheDocument();
    expect(getByText(/^Deny list$/)).toBeInTheDocument();
    expect(getByText('Disclaimer')).toBeInTheDocument();
    expect(getByPlaceholderText('https://www.example.com')).toBeInTheDocument();
    expect(getByPlaceholderText('Add allowed domain...')).toBeInTheDocument();
    expect(getByPlaceholderText('Add blocked domain...')).toBeInTheDocument();
  });

  it('calls onConfigure and returns parameters and targetState', async () => {
    let result: { parameters?: unknown; targetState?: unknown } = {};
    mockSdk.app.getCurrentState.mockResolvedValue({});
    mockSdk.app.onConfigure.mockImplementation((cb: () => Promise<unknown>) => {
      return Promise.resolve(cb()).then((out) => {
        result = out as { parameters?: unknown; targetState?: unknown };
        return out;
      });
    });

    render(<ConfigScreen />);

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      const cb = mockSdk.app.onConfigure.mock.calls[0]?.[0];
      if (cb) await cb();
    });

    expect(result.parameters).toBeDefined();
    expect(result.targetState).toBeDefined();
  });
});
