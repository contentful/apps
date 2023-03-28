import { useState, useEffect } from 'react';
import { Stack, Box, Select, FormControl, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { AccountSummariesType, ConfigurationWarningTypes } from 'types';
import {
  NO_PROPERTIES,
  getPropertyDeletedMsg,
  WarningTypes,
} from 'components/config-screen/WarningDisplay/constants/warningMessages';
import WarningDisplay from 'components/config-screen/WarningDisplay/WarningDisplay';
import Note from 'components/common/Note/Note';

interface Props {
  onSelectionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isPropertyIdInOptions: boolean;
  selectedPropertyId: string;
  sortedAccountSummaries: AccountSummariesType[];
  originalPropertyId: string;
}

const getIdOnly = (unformattedId: string) => {
  return unformattedId.split('/')[1];
};

const MapAccountPropertyDropdown = (props: Props) => {
  const {
    onSelectionChange,
    isPropertyIdInOptions,
    selectedPropertyId,
    sortedAccountSummaries,
    originalPropertyId,
  } = props;

  const [warningType, setWarningType] = useState<ConfigurationWarningTypes>(WarningTypes.Empty);
  const [tooltipContent, setTooltipContent] = useState<string>('');

  useEffect(() => {
    let content = '';

    if (selectedPropertyId === originalPropertyId && !isPropertyIdInOptions) {
      setWarningType(WarningTypes.Error);
      content += getPropertyDeletedMsg(getIdOnly(originalPropertyId));
    }

    if (!content) {
      setWarningType('');
    }

    setTooltipContent(content);
  }, [selectedPropertyId, originalPropertyId, isPropertyIdInOptions]);

  const validateSelection = () => {
    if (selectedPropertyId === originalPropertyId && !isPropertyIdInOptions) {
      return '';
    } else {
      return selectedPropertyId;
    }
  };

  return (
    <>
      {sortedAccountSummaries.length ? (
        <Stack spacing="spacingXs">
          <WarningDisplay warningType={warningType} tooltipContent={tooltipContent} />
          <Box>
            <FormControl>
              <Select
                testId="accountPropertyDropdown"
                value={validateSelection()}
                onChange={onSelectionChange}
                isInvalid={warningType === WarningTypes.Error}>
                <Select.Option key="empty option" value="" isDisabled>
                  Select a property...
                </Select.Option>
                {sortedAccountSummaries.map((accountSummary: AccountSummariesType) => (
                  <optgroup
                    label={`${accountSummary.displayName} (${getIdOnly(accountSummary.account)})`}
                    key={accountSummary.account}>
                    {accountSummary.propertySummaries.map((propertySummary) => (
                      <Select.Option
                        key={propertySummary.property}
                        value={propertySummary.property}>
                        {`${propertySummary.displayName} (${getIdOnly(propertySummary.property)})`}
                      </Select.Option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <FormControl.HelpText marginTop="spacingM">
                If you don't see a property in the dropdown, make sure the Google service account
                installed above has been given "viewer" access to it in Google Analytics.{' '}
                <em>Note:</em> Only Google Analytics 4 properties are listed; Google "Universal
                Analytics" properties are not supported. See{' '}
                <TextLink
                  href="https://support.google.com/analytics/answer/10759417"
                  target="_blank"
                  icon={<ExternalLinkIcon />}
                  alignIcon="end">
                  "Make the switch to Google Analytics 4"
                </TextLink>{' '}
                for more information.
              </FormControl.HelpText>
            </FormControl>
          </Box>
        </Stack>
      ) : (
        <Note body={NO_PROPERTIES} variant="neutral" />
      )}
    </>
  );
};

export default MapAccountPropertyDropdown;
