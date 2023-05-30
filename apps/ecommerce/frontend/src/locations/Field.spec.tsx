import Field from './Field';
import { render } from '@testing-library/react';
import { mockCma, mockSdk, mockAutoResizer, mockCrypto } from '../../test/mocks';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => mockAutoResizer,
  useFieldValue: () => [undefined],
}));
Object.defineProperty(globalThis, 'crypto', {
  value: mockCrypto,
});

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field />);

    expect(getByText('Show JSON')).toBeInTheDocument();
  });
});
