import { mockSdk } from '../../../../test/mocks';
import { act, render, screen } from '@testing-library/react';
import ConfigurationPage from './ConfigurationPage';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Config Screen component (not installed)', () => {
  it('can render the about section', async () => {
    await act(async () => {
      render(<ConfigurationPage />);
    });

    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });
});
