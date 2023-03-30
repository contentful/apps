import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WarningDisplay from 'components/config-screen/WarningDisplay/WarningDisplay';

describe('WarningDisplay component', () => {
  it('renders an error icon and correct tooltip content', async () => {
    const user = userEvent.setup();

    render(<WarningDisplay warningType="error" tooltipContent="This is an error" />);

    expect(screen.getByTestId('errorIcon')).toBeVisible();

    await user.hover(screen.getByTestId('cf-ui-icon'));

    expect(screen.getByRole('tooltip').textContent).toBe('This is an error');
  });

  it('renders a warning icon and correct tooltip content', async () => {
    const user = userEvent.setup();

    render(<WarningDisplay warningType="warning" tooltipContent="This is a warning" />);

    expect(screen.getByTestId('warningIcon')).toBeVisible();

    await user.hover(screen.getByTestId('cf-ui-icon'));

    expect(screen.getByRole('tooltip').textContent).toBe('This is a warning');
  });

  it('renders an empty div if there are no warnings or errors', () => {
    render(<WarningDisplay warningType="" tooltipContent="" />);

    expect(screen.getByTestId('noStatus')).toBeVisible();
  });
});
