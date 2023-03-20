import { useState, useEffect } from 'react';
import {
  Stack,
  Box,
  Subheading,
  Paragraph,
  Select,
  Spinner,
  Flex,
  Tooltip,
} from '@contentful/f36-components';
import { AccountSummariesType, FlattenedPropertiesType } from 'types';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';
import { WarningIcon } from '@contentful/f36-icons';

interface Props {
  accountsSummaries: AccountSummariesType[];
  parameters: KeyValueMap;
  mergeSdkParameters: Function;
  onIsValidAccountProperty: Function;
}

export default function MapAccountPropertySection(props: Props) {
  const { accountsSummaries, parameters, mergeSdkParameters, onIsValidAccountProperty } = props;

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [flattenedProperties, setFlattenedProperties] = useState<FlattenedPropertiesType[]>([]);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(true);
  const [loadingParameters, setLoadingParameters] = useState<boolean>(true);
  const [hasErrors, setHasErrors] = useState<boolean>(false);

  useEffect(() => {
    if (parameters.propertyId) {
      const propertyIds = flattenedProperties.map((e) => e.propertyId);
      if (propertyIds.includes(parameters.propertyId)) {
        setSelectedPropertyId(parameters.propertyId);
        setHasErrors(false);
      } else {
        setHasErrors(true);
      }

      setLoadingParameters(false);
      setLoadingProperties(false);
      onIsValidAccountProperty(true);
    } else {
      onIsValidAccountProperty(false);
      setHasErrors(false);
      setLoadingParameters(false);
      setLoadingProperties(false);
    }
  }, [flattenedProperties, onIsValidAccountProperty, parameters.propertyId]);

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
  }, [accountsSummaries]);

  const handleSelectionChange = (e: any) => {
    const _selectedPropertyId = e.target.value;
    setSelectedPropertyId(_selectedPropertyId);
    mergeSdkParameters({ propertyId: _selectedPropertyId });
    onIsValidAccountProperty(true);
  };

  const shouldRenderDropdown = () => {
    return !loadingProperties && !loadingParameters && flattenedProperties;
  };

  return (
    <Stack spacing="spacingL" marginBottom="none" flexDirection="column" alignItems="flex-start">
      <Box>
        <Subheading>Configuration</Subheading>
        <Paragraph>Choose your Account and associated Property</Paragraph>
        <Flex alignItems="center">
          {hasErrors && (
            <Tooltip
              placement="top"
              content={
                'Previously saved property does not exist in the current dropdown menu. Either select a new option from the dropdown or configure the property in Google Analtyics 4'
              }>
              <WarningIcon marginRight="spacingS" size="medium" variant="warning" />
            </Tooltip>
          )}
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
        </Flex>
      </Box>
    </Stack>
  );
}
