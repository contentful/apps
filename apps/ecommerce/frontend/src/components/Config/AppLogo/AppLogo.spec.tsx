import { render, screen } from '@testing-library/react';
import AppLogo from './AppLogo';

describe('App Logo component', () => {
  it('mounts', () => {
    render(<AppLogo error={undefined} isLoading={false} logoUrl="" />);

    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});

describe('App Logo component loading state', () => {
  it('mounts', () => {
    render(<AppLogo error={undefined} isLoading={true} logoUrl="" />);

    expect(screen.getByTestId('cf-ui-skeleton-form')).toBeInTheDocument();
  });
});

describe('App Logo component error state', () => {
  it('mounts', () => {
    render(<AppLogo error={new Error()} isLoading={false} logoUrl="" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
