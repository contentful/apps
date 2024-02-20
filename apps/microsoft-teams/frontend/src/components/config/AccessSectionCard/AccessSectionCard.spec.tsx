import AccessSectionCard from './AccessSectionCard';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { mockParameters } from '@test/mocks';
import { accessSection } from '@constants/configCopy';

describe('AccessSectionCard component', () => {
  it('displays correct copy when authorized', () => {
    const { unmount } = render(
      <AccessSectionCard
        parameters={mockParameters}
        loginInProgress={false}
        logoutInProgress={false}
        handleLogin={vi.fn()}
        handleLogout={vi.fn()}
      />
    );

    expect(screen.getByText(mockParameters.orgName)).toBeTruthy();
    expect(screen.getByAltText('logo')).toBeTruthy();
    unmount();
  });

  it('displays correct copy when unauthorized', () => {
    const { unmount } = render(
      <AccessSectionCard
        parameters={{ ...mockParameters, orgName: '' }}
        loginInProgress={false}
        logoutInProgress={false}
        handleLogin={vi.fn()}
        handleLogout={vi.fn()}
      />
    );

    expect(screen.getByText(mockParameters.authenticatedUsername)).toBeTruthy();
    expect(screen.getByText(accessSection.orgDetailsError)).toBeTruthy();
    unmount();
  });

  it('calls handlers when buttons are clicked', () => {
    const loginSpy = vi.fn();
    const logoutSpy = vi.fn();

    const { unmount } = render(
      <AccessSectionCard
        parameters={{ ...mockParameters, orgName: '' }}
        loginInProgress={false}
        logoutInProgress={false}
        handleLogin={loginSpy}
        handleLogout={logoutSpy}
      />
    );

    const loginButton = screen.getByText(accessSection.retry);
    const logoutButton = screen.getByText(accessSection.logout);

    loginButton.click();
    logoutButton.click();

    expect(loginSpy).toHaveBeenCalledOnce();
    expect(logoutSpy).toHaveBeenCalledOnce();
    unmount();
  });
});
