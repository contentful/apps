import ConfigScreen from './ConfigScreen';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    const { getByText } = render(<ConfigScreen />);

    expect(getByText('Set up Google Drive app')).toBeTruthy();
    expect(
      getByText(
        'Connect Google Drive to Contentful to seamlessly connect content, eliminating copy-paste, reducing errors, and speeding up your publishing workflow.'
      )
    ).toBeTruthy();
  });
});
