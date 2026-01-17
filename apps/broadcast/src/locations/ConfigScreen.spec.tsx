import ConfigScreen from './ConfigScreen';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('renders configuration content', async () => {
    const { findByText } = render(<ConfigScreen />);

    expect(await findByText('Voice & Video Studio')).toBeInTheDocument();
  });
});
