import Page from './Page';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Page component', () => {
  it('renders the audit logs heading', () => {
    const { getByText } = render(<Page />);

    expect(getByText('Audit Log Viewer')).toBeInTheDocument();
  });
});
