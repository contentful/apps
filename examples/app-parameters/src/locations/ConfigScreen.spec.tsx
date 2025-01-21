import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockSdk } from '../../test/mocks';
import ConfigScreen from './ConfigScreen';
import useGetAllContentTypes from '../hooks/useGetAllContentTypes';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('../hooks/useGetAllContentTypes', async () => {
  const actual = await vi.importActual('../hooks/useGetAllContentTypes');
  return {
    ...(actual as typeof useGetAllContentTypes),
    useGetAllContentTypes: {
      allContentTypes: [],
      selectedContentTypes: [],
      setSelectedContentTypes: vi.fn(),
      isLoading: false,
    },
  };
});

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    const { getByText } = render(<ConfigScreen />);

    // simulate the user clicking the install button
    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(getByText('Content Type Summary App')).toBeTruthy();
  });
});
