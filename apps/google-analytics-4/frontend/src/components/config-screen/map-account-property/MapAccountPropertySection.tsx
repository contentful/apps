import { useState, useEffect } from 'react';
import { Stack, Box, Subheading, Paragraph, Select, Spinner } from '@contentful/f36-components';
import { AccountSummariesType, FlattenedPropertiesType } from 'types';
import useKeyService from 'hooks/useKeyService';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

interface Props {
  accountsSummaries: AccountSummariesType[];
}

export default function MapAccountPropertySection(props: Props) {
  const { accountsSummaries } = props;
  const { handlePropertyChange } = useKeyService({});
  const sdk = useSDK<AppExtensionSDK>();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [flattenedProperties, setFlattenedProperties] = useState<FlattenedPropertiesType[]>([]);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(true);
  const [loadingParameters, setLoadingParameters] = useState<boolean>(true);

  useEffect(() => {
    const fetchParametersFromSdk = async () => {
      const parameters = await sdk.app.getParameters();
      if (parameters?.savedPropertyId) setSelectedPropertyId(parameters.savedPropertyId);
      setLoadingParameters(false);
    };

    fetchParametersFromSdk();
  }, [sdk]);

  useEffect(() => {
    const _flattenedProperties = [] as FlattenedPropertiesType[];
    accountsSummaries.forEach((accountSummary) => {
      accountSummary.propertySummaries.forEach((propertySummary) => {
        _flattenedProperties.push({
          propertyId: propertySummary.property,
          propertyName: propertySummary.displayName,
          accountName: accountSummary.displayName,
        });
      });
    });

    setFlattenedProperties(_flattenedProperties);
    setLoadingProperties(false);
  }, [accountsSummaries]);

  const handleSelectionChange = (e: any) => {
    const _selectedPropertyId = e.target.value;
    setSelectedPropertyId(_selectedPropertyId);
    handlePropertyChange(_selectedPropertyId);
  };

  const shouldRenderDropdown = () => {
    return (
      !loadingProperties && !loadingParameters && accountsSummaries.length && flattenedProperties
    );
  };

  return (
    <Stack spacing="spacingL" marginBottom="none" flexDirection="column" alignItems="flex-start">
      <Box>
        <Subheading>Configuration</Subheading>
        <Paragraph>Choose your Account and associated Property</Paragraph>
        {shouldRenderDropdown() ? (
          <Select
            testId="accountPropertyDropdown"
            value={selectedPropertyId}
            onChange={handleSelectionChange}>
            <Select.Option key="empty option" value="" isDisabled>
              Please select an option...
            </Select.Option>
            {flattenedProperties.map((flattenedProperty: any) => {
              return (
                <Select.Option
                  key={flattenedProperty.propertyId}
                  value={flattenedProperty.propertyId}>
                  {`${flattenedProperty.accountName} -> ${flattenedProperty.propertyName}`}
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
