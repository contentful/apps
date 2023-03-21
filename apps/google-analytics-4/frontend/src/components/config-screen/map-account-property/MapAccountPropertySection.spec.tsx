import { mockSdk } from '../../../../test/mocks';
import { act, render, screen } from '@testing-library/react';
import MapAccountPropertyPage from './MapAccountPropertySection';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const ACCOUNT_SUMMARIES = [
  {
    propertySummaries: [
      {
        property: 'properties/354562715',
        displayName: 'property1',
        propertyType: 'PROPERTY_TYPE_ORDINARY',
        parent: 'accounts/257755730',
      },
      {
        property: 'properties/354612161',
        displayName: 'property2',
        propertyType: 'PROPERTY_TYPE_ORDINARY',
        parent: 'accounts/257755730',
      },
      {
        property: 'properties/355035053',
        displayName: 'beast',
        propertyType: 'PROPERTY_TYPE_ORDINARY',
        parent: 'accounts/257755730',
      },
    ],
    name: 'accountSummaries/257755730',
    account: 'accounts/257755730',
    displayName: 'contentful-fake-test',
  },
  {
    propertySummaries: [
      {
        property: 'properties/354946822',
        displayName: 'property-1',
        propertyType: 'PROPERTY_TYPE_ORDINARY',
        parent: 'accounts/258082603',
      },
    ],
    name: 'accountSummaries/258082603',
    account: 'accounts/258082603',
    displayName: 'contentful-fake-test-2',
  },
];

describe('Empty Account Properties mapping dropdown', () => {
  it('does not render the dropdown', async () => {
    await act(async () => {
      render(
        <MapAccountPropertyPage
          accountsSummaries={[]}
          parameters={{}}
          mergeSdkParameters={() => {}}
          onIsValidAccountProperty={() => {}}
        />
      );
    });

    expect(screen.getByText('Google Analytics 4 property')).toBeVisible();
    expect(screen.queryByTestId('accountPropertyDropdown')).toBeNull();
  });
});

describe('Account Properties mapping dropdown', () => {
  it('renders the dropdown', async () => {
    await act(async () => {
      render(
        <MapAccountPropertyPage
          accountsSummaries={ACCOUNT_SUMMARIES}
          parameters={{}}
          mergeSdkParameters={() => {}}
          onIsValidAccountProperty={() => {}}
        />
      );
    });

    const propertiesDropdown = screen.getByTestId('accountPropertyDropdown');

    expect(screen.getByText('Google Analytics 4 property')).toBeVisible();
    expect(propertiesDropdown).toBeVisible();
  });
});
