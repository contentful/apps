import Page from './Page';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Page component', () => {
  it('renders usage dashboard', async () => {
    const { findByText } = render(<Page />);

    expect(await findByText('Broadcast Usage Dashboard')).toBeInTheDocument();
  });
});
