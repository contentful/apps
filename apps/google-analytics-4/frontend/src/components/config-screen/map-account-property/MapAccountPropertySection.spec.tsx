import { mockSdk, mockAccountSummaries } from '../../../../test/mocks';
import { render, screen } from '@testing-library/react';
import MapAccountPropertyPage from './MapAccountPropertySection';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Empty Account Properties mapping dropdown', () => {
  it('does not render the dropdown', () => {
    render(
      <MapAccountPropertyPage
        accountsSummaries={[]}
        parameters={{}}
        mergeSdkParameters={() => {}}
        onIsValidAccountProperty={() => {}}
        originalPropertyId={''}
        isApiAccessLoading={false}
      />
    );

    expect(screen.getByText('Google Analytics 4 property')).toBeInTheDocument();
    expect(screen.queryByTestId('accountPropertyDropdown')).toBeNull();
  });
});

describe('Account Properties mapping dropdown', () => {
  it('renders the dropdown', () => {
    render(
      <MapAccountPropertyPage
        accountsSummaries={mockAccountSummaries}
        parameters={{}}
        mergeSdkParameters={() => {}}
        onIsValidAccountProperty={() => {}}
        originalPropertyId={''}
        isApiAccessLoading={false}
      />
    );

    const propertiesDropdown = screen.getByTestId('accountPropertyDropdown');

    expect(screen.getByText('Google Analytics 4 property')).toBeInTheDocument();
    expect(propertiesDropdown).toBeVisible();
  });
});
