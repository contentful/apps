import Page from './Page';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Page component', () => {
  it('Renders brand guidelines generator heading', () => {
    const { getByText } = render(<Page />);

    expect(getByText('AI-Powered Brand Guidelines Generator')).toBeInTheDocument();
  });

  it('Renders generate button', () => {
    const { getByText } = render(<Page />);

    expect(getByText('Generate Brand Guidelines PDF')).toBeInTheDocument();
  });
});
