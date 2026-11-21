import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen from './ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('renders the config UI and blocks install when required fields are empty', async () => {
    const { findByText } = render(<ConfigScreen />);

    const configureResult = await mockSdk.app.onConfigure.mock.calls[0][0]();
    expect(configureResult).toBe(false);

    expect(await findByText('App Config')).toBeTruthy();
  });
});
