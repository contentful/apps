import { useState, useEffect } from 'react';
import { Stack, Select, TextLink, Paragraph } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
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

  const selectionValue =
    selectedPropertyId === originalPropertyId && !isPropertyIdInOptions ? '' : selectedPropertyId;

  return (
    <>
      {sortedAccountSummaries.length ? (
        <Stack spacing="spacingXs" flexDirection="column" alignItems="flex-start">
          <Stack spacing="spacingXs">
            <WarningDisplay warningType={warningType} tooltipContent={tooltipContent} />
            <Select
              testId="accountPropertyDropdown"
              value={selectionValue}
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
                    <Select.Option key={propertySummary.property} value={propertySummary.property}>
                      {`${propertySummary.displayName} (${getIdOnly(propertySummary.property)})`}
                    </Select.Option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Stack>
          <Paragraph marginTop="spacingM" style={{ color: tokens.gray600 }}>
            If you don't see a property in the dropdown, make sure the Google service account
            installed above has been given "viewer" access to it in Google Analytics. <em>Note:</em>{' '}
            Only Google Analytics 4 properties are listed; Google "Universal Analytics" properties
            are not supported. See{' '}
            <TextLink
              href="https://support.google.com/analytics/answer/10759417"
              target="_blank"
              icon={<ExternalLinkIcon />}
              alignIcon="end">
              "Make the switch to Google Analytics 4"
            </TextLink>{' '}
            for more information.
          </Paragraph>
        </Stack>
      ) : (
        <Note body={NO_PROPERTIES} variant="warning" />
      )}
    </>
  );
};

export default MapAccountPropertyDropdown;
