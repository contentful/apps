import { act, render, screen } from '@testing-library/react';
import ConfigurationPage from './ConfigurationPage';

describe('Config Screen component (not installed)', () => {
  it('can render the about section', async () => {
    await act(async () => {
      render(<ConfigurationPage/>);
    });

    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });
});