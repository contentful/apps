import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import Field from './Field';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Field component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Field />);

    expect(getByText('Hello Entry Field Component (AppId: test-app)')).toBeInTheDocument();
  });
});
