import { useState, useEffect } from 'react';
import { Stack, Box, Subheading, Paragraph, Skeleton, Flex } from '@contentful/f36-components';
import { AccountSummariesType } from 'types';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';
import MapAccountPropertyDropdown from 'components/config-screen/map-account-property/MapAccountPropertyDropdown';

interface Props {
  accountsSummaries: AccountSummariesType[];
  parameters: KeyValueMap;
  mergeSdkParameters: Function;
  onIsValidAccountProperty: Function;
  originalPropertyId: string;
  isApiAccessLoading: boolean;
}

export default function MapAccountPropertySection(props: Props) {
  const {
    accountsSummaries,
    parameters,
    mergeSdkParameters,
    onIsValidAccountProperty,
    originalPropertyId,
    isApiAccessLoading,
  } = props;

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [sortedAccountSummaries, setSortedAccountSummaries] = useState<AccountSummariesType[]>([]);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(true);
  const [loadingParameters, setLoadingParameters] = useState<boolean>(true);
  const [isPropertyIdInOptions, setIsPropertyIdInOptions] = useState<boolean>(true);

  useEffect(() => {
    if (parameters.propertyId === originalPropertyId) {
      const isInOptions = sortedAccountSummaries.some((accountSummary) => {
        return accountSummary.propertySummaries.some((propertySummary) => {
          return propertySummary.property === originalPropertyId;
        });
      });

      setIsPropertyIdInOptions(isInOptions);
    }
  }, [sortedAccountSummaries, originalPropertyId, parameters.propertyId]);

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

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const _selectedPropertyId = e.target.value;
    setSelectedPropertyId(_selectedPropertyId);
    mergeSdkParameters({ propertyId: _selectedPropertyId });
    onIsValidAccountProperty(true);
  };

  return (
    <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start">
      <div>
        <Subheading marginBottom="spacingXs">Google Analytics 4 property</Subheading>
        <Paragraph marginBottom="none">
          In the dropdown below, select the Google Analytics 4 property that's connected to the
          website where your content appears.
        </Paragraph>
      </div>
      {!loadingProperties && !loadingParameters && !isApiAccessLoading ? (
        <Box marginTop="none">
          <MapAccountPropertyDropdown
            onSelectionChange={handleSelectionChange}
            isPropertyIdInOptions={isPropertyIdInOptions}
            selectedPropertyId={selectedPropertyId}
            sortedAccountSummaries={sortedAccountSummaries}
            originalPropertyId={originalPropertyId}
          />
        </Box>
      ) : (
        <Flex marginTop="none" fullWidth={true}>
          <Skeleton.Container svgHeight={139}>
            <Skeleton.BodyText numberOfLines={6} />
          </Skeleton.Container>
        </Flex>
      )}
    </Stack>
  );
}
