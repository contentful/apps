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
  const [flattenedProperties, setFlattenedProperties] = useState<FlattenedPropertiesType[]>([]);
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
    const _flattenedProperties = [] as FlattenedPropertiesType[];
    accountsSummaries.forEach((accountSummary) => {
      accountSummary.propertySummaries.forEach((propertySummary) => {
        _flattenedProperties.push({
          propertyId: getIdOnly(propertySummary.property),
          accountId: getIdOnly(accountSummary.account),
          propertyName: propertySummary.displayName,
          accountName: accountSummary.displayName,
        });
      });
    });

    const alphabetizedProperties = _flattenedProperties.sort((v1, v2) => {
      return v1.accountName.toLocaleLowerCase() < v2.accountName.toLocaleLowerCase() ||
        v1.propertyName.toLocaleLowerCase() <= v2.propertyName.toLocaleLowerCase()
        ? -1
        : 1;
    });

    setFlattenedProperties(alphabetizedProperties);
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
      !loadingProperties && !loadingParameters && accountsSummaries.length && flattenedProperties
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
            {flattenedProperties.map((flattenedProperty: FlattenedPropertiesType) => {
              return (
                <Select.Option
                  key={flattenedProperty.propertyId}
                  value={flattenedProperty.propertyId}>
                  {`${flattenedProperty.accountName} (${flattenedProperty.accountId}) > ${flattenedProperty.propertyName} (${flattenedProperty.propertyId})`}
                </Select.Option>
              );
            })}
          </Select>
        ) : (
          <Spinner variant="primary" />
        )}
      </Box>
    </Stack>
  );
}
