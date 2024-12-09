import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockAccountSummaries } from '../../../../test/mocks';
import MapAccountPropertyDropdown from 'components/config-screen/map-account-property/MapAccountPropertyDropdown';
import { NO_PROPERTIES } from 'components/config-screen/WarningDisplay/constants/warningMessages';
import { vi } from 'vitest';

const onSelectionChange = vi.fn();

describe('Property selection dropdown', () => {
  it('renders a dropdown with options if there are account summaries', () => {
    render(
      <MapAccountPropertyDropdown
        onSelectionChange={onSelectionChange}
        isPropertyIdInOptions={true}
        selectedPropertyId={''}
        sortedAccountSummaries={mockAccountSummaries}
        originalPropertyId={''}
      />
    );

    expect(screen.getByTestId('accountPropertyDropdown')).toBeVisible();
  });

  it('renders a note when there are no account summaries', () => {
    render(
      <MapAccountPropertyDropdown
        onSelectionChange={onSelectionChange}
        isPropertyIdInOptions={false}
        selectedPropertyId={''}
        sortedAccountSummaries={[]}
        originalPropertyId={''}
      />
    );

    expect(screen.getByText(NO_PROPERTIES)).toBeVisible();
  });

  it('calls change handler when property selection is changed', async () => {
    const user = userEvent.setup();
    render(
      <MapAccountPropertyDropdown
        onSelectionChange={onSelectionChange}
        isPropertyIdInOptions={true}
        selectedPropertyId={''}
        sortedAccountSummaries={mockAccountSummaries}
        originalPropertyId={''}
      />
    );

    await user.selectOptions(screen.getByTestId('accountPropertyDropdown'), [
      'properties/354612161',
    ]);

    expect(onSelectionChange).toHaveBeenCalled();
  });

  it('renders an error icon when property id is deleted', () => {
    render(
      <MapAccountPropertyDropdown
        onSelectionChange={onSelectionChange}
        isPropertyIdInOptions={false}
        selectedPropertyId={'properties/355035090'}
        sortedAccountSummaries={mockAccountSummaries}
        originalPropertyId={'properties/355035090'}
      />
    );

    expect(screen.getByTestId('errorIcon')).toBeInTheDocument();
  });
});
