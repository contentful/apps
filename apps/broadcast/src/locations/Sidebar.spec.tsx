import Sidebar from './Sidebar';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: vi.fn(),
}));

describe('Sidebar component', () => {
  it('renders generation controls', () => {
    const { getByText } = render(<Sidebar />);

    expect(getByText('Target locale')).toBeInTheDocument();
    expect(getByText('Generate Audio')).toBeInTheDocument();
  });
});
