import { useState, useEffect } from 'react';
import { Stack, Box, Subheading, Select, Spinner } from '@contentful/f36-components';
import { AccountSummariesType, FlattenedPropertiesType } from 'types';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';

interface Props {
  accountsSummaries: AccountSummariesType[];
  parameters: KeyValueMap;
  mergeSdkParameters: Function;
  onIsValidAccountProperty: Function;
}

const getIdOnly = (unformattedId: string) => {
  return unformattedId.split('/')[1];
};

export default function MapAccountPropertySection(props: Props) {
  const { accountsSummaries, parameters, mergeSdkParameters, onIsValidAccountProperty } = props;

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [sortedAccountSummaries, setSortedAccountSummaries] = useState<AccountSummariesType[]>([]);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(true);
  const [loadingParameters, setLoadingParameters] = useState<boolean>(true);

  useEffect(() => {
    if (parameters.propertyId) {
      setSelectedPropertyId(parameters.propertyId);
      onIsValidAccountProperty(true);
    } else {
      onIsValidAccountProperty(false);
    }
    setLoadingParameters(false);
  }, [onIsValidAccountProperty, parameters.propertyId]);

  useEffect(() => {
    accountsSummaries.sort((a, b) => {
      return a.displayName < b.displayName ? -1 : a.displayName > b.displayName ? 1 : 0;
    });

    accountsSummaries.forEach((accountSummary) => {
      accountSummary.propertySummaries.sort((a, b) => {
        return a.displayName < b.displayName ? -1 : a.displayName > b.displayName ? 1 : 0;
      });
    });

    setSortedAccountSummaries(accountsSummaries);
    setLoadingProperties(false);
  }, [accountsSummaries]);

  const handleSelectionChange = (e: any) => {
    const _selectedPropertyId = e.target.value;
    setSelectedPropertyId(_selectedPropertyId);
    mergeSdkParameters({ propertyId: _selectedPropertyId });
    onIsValidAccountProperty(true);
  };

  const shouldRenderDropdown = () => {
    return (
      !loadingProperties &&
      !loadingParameters &&
      accountsSummaries.length &&
      sortedAccountSummaries.length
    );
  };

  return (
    <Stack spacing="spacingXs" marginBottom="none" flexDirection="column" alignItems="flex-start">
      <Box marginBottom="spacingS">
        <Subheading>Select account and property</Subheading>
        Note: Only <b>Google Analytics 4</b> properties will appear in the dropdown. This app does
        not support Google "Universal Analytics" properties.
      </Box>
      <Box>
        {shouldRenderDropdown() ? (
          <Select
            testId="accountPropertyDropdown"
            value={selectedPropertyId}
            onChange={handleSelectionChange}>
            <Select.Option key="empty option" value="" isDisabled>
              Select a "[Analytics Account] {'>'} [Property]" option...
            </Select.Option>
            {sortedAccountSummaries.map((accountSummary: AccountSummariesType) => (
              <optgroup
                label={`${accountSummary.displayName} (${getIdOnly(accountSummary.account)})`}
                key={getIdOnly(accountSummary.account)}>
                {accountSummary.propertySummaries.map((propertySummary) => (
                  <Select.Option
                    key={getIdOnly(propertySummary.property)}
                    value={getIdOnly(propertySummary.property)}>
                    {`${propertySummary.displayName} (${getIdOnly(propertySummary.property)}))`}
                  </Select.Option>
                ))}
              </optgroup>
            ))}
          </Select>
        ) : (
          <Spinner variant="primary" />
        )}
      </Box>
    </Stack>
  );
}
