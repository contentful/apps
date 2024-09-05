import { render, screen, waitFor } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import Page from './Page';
import { act } from 'react';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  setAppActions: () => jest.fn(),
}));

describe('Page component', () => {
  it('Component text exists', async () => {
    await act(async () => {
      render(<Page />);
    });

    await waitFor(() => {
      expect(screen.getByText('App Actions')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('name');
    });
  });
});
