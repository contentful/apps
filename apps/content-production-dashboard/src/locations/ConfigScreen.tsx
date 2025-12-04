import React, { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Flex,
  FormControl,
  Select,
  Switch,
  Text,
  Paragraph,
  TextInput,
  Image,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import ContentTypeMultiSelect, { ContentType } from '../components/ContentTypeMultiSelect';
import tokens from '@contentful/f36-tokens';
import { DEFAULT_PARAMS, VALIDATION_RANGES, DEFAULT_TIME_RANGE } from '../utils/consts';
import { ValidationErrors } from '../utils/types';
import gearImage from '../assets/gear.png';
import appearanceImage from '../assets/appearance.png';

export interface AppInstallationParameters {
  trackedContentTypes?: string[];
  needsUpdateMonths?: number;
  defaultTimeRange?: 'all' | 'year' | 'sixMonths';
  recentlyPublishedDays?: number;
  showUpcomingReleases?: boolean;
  timeToPublishDays?: number;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>(DEFAULT_PARAMS);
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const validateRange = (
    value: number,
    field: 'needsUpdateMonths' | 'recentlyPublishedDays' | 'timeToPublishDays'
  ): void => {
    const range = VALIDATION_RANGES[field];

    if (value < range.min || value > range.max) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: `Value must be between ${range.min} and ${range.max}`,
      }));
      return;
    }

    // Clear error if valid
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleDefaultTimeRangeChange = (value: string) => {
    setParameters((prev) => ({
      ...prev,
      defaultTimeRange: value as 'all' | 'year' | 'sixMonths',
    }));
  };

  const handleInputWithRangeValidation = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: 'needsUpdateMonths' | 'recentlyPublishedDays' | 'timeToPublishDays'
  ) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    validateRange(numValue, field);

    if (numValue !== null) {
      setParameters((prev) => ({
        ...prev,
        [field]: numValue,
      }));
    }
  };

  const handleShowUpcomingReleasesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;

    setParameters((prev) => ({
      ...prev,
      showUpcomingReleases: checked,
    }));
  };

  return (
    <Flex flexDirection="column" fullWidth>
      <Flex flexDirection="column" style={{ margin: 'auto', padding: tokens.spacingL }}>
        <Form>
          <Heading marginBottom="spacingM">Set up Content Production Dashboard</Heading>
          <Paragraph marginBottom="spacingL">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Paragraph>

          <Heading as="h3" marginBottom="spacingM" marginTop="spacingL">
            Configure app
          </Heading>
          <Text as="p" marginBottom="spacingL" fontSize="fontSizeM" fontColor="gray600">
            Section subtitle with basic instructions
          </Text>

          <>
            <FormControl marginBottom="spacingL" isInvalid={!!validationErrors.needsUpdateMonths}>
              <FormControl.Label>
                Content &quot;Needs update&quot; time threshold (months)
              </FormControl.Label>
              <TextInput
                id="needs-update-months"
                name="needs-update-months"
                type="number"
                value={parameters.needsUpdateMonths?.toString()}
                onChange={(event) => handleInputWithRangeValidation(event, 'needsUpdateMonths')}
              />
              {validationErrors.needsUpdateMonths && (
                <FormControl.ValidationMessage>
                  {validationErrors.needsUpdateMonths}
                </FormControl.ValidationMessage>
              )}
              <FormControl.HelpText>
                Content will be marked as &quot;Needs update&quot; when it hasn&apos;t been updated
                for this amount of time. Range: {VALIDATION_RANGES.needsUpdateMonths.min}-
                {VALIDATION_RANGES.needsUpdateMonths.max} months.
              </FormControl.HelpText>
            </FormControl>

            <FormControl marginBottom="spacingL">
              <FormControl.Label>Default time range for content trends</FormControl.Label>
              <Select
                id="default-time-range"
                name="default-time-range"
                value={parameters.defaultTimeRange}
                onChange={(e) => handleDefaultTimeRangeChange(e.target.value)}>
                {Object.entries(DEFAULT_TIME_RANGE).map(([rangeKey, label]) => (
                  <Select.Option key={rangeKey} value={rangeKey}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
              <FormControl.HelpText>
                The default time period to display in content trend charts.
              </FormControl.HelpText>
            </FormControl>

            <FormControl
              marginBottom="spacingL"
              isInvalid={!!validationErrors.recentlyPublishedDays}>
              <FormControl.Label>
                &quot;Recently published&quot; time period (days)
              </FormControl.Label>
              <TextInput
                id="recently-published-days"
                name="recently-published-days"
                type="number"
                value={parameters.recentlyPublishedDays?.toString()}
                onChange={(event) => handleInputWithRangeValidation(event, 'recentlyPublishedDays')}
              />
              {validationErrors.recentlyPublishedDays && (
                <FormControl.ValidationMessage>
                  {validationErrors.recentlyPublishedDays}
                </FormControl.ValidationMessage>
              )}
              <FormControl.HelpText>
                Content will be considered &quot;Recently published&quot; if it was published within
                this time period. Range: {VALIDATION_RANGES.recentlyPublishedDays.min}-
                {VALIDATION_RANGES.recentlyPublishedDays.max} days.
              </FormControl.HelpText>
            </FormControl>

            <FormControl marginBottom="spacingL" isInvalid={!!validationErrors.timeToPublishDays}>
              <FormControl.Label>Time to publish threshold (days)</FormControl.Label>
              <TextInput
                id="time-to-publish-days"
                name="time-to-publish-days"
                type="number"
                value={parameters.timeToPublishDays?.toString()}
                onChange={(event) => handleInputWithRangeValidation(event, 'timeToPublishDays')}
              />
              {validationErrors.timeToPublishDays && (
                <FormControl.ValidationMessage>
                  {validationErrors.timeToPublishDays}
                </FormControl.ValidationMessage>
              )}
              <FormControl.HelpText>
                The time period to calculate average time to publish metrics. Range:{' '}
                {VALIDATION_RANGES.timeToPublishDays.min}-{VALIDATION_RANGES.timeToPublishDays.max}{' '}
                days.
              </FormControl.HelpText>
            </FormControl>

            <FormControl marginBottom="spacingL">
              <Switch
                id="show-upcoming-releases"
                name="show-upcoming-releases"
                isChecked={parameters.showUpcomingReleases}
                onChange={handleShowUpcomingReleasesChange}>
                Show &apos;Upcoming release&apos; section
              </Switch>
              <FormControl.HelpText>
                Toggle visibility of the upcoming releases section on the dashboard.
              </FormControl.HelpText>
            </FormControl>

            <FormControl marginBottom="spacingL">
              <FormControl.Label>Content types to track in publication trends</FormControl.Label>
              <ContentTypeMultiSelect
                selectedContentTypes={selectedContentTypes}
                setSelectedContentTypes={setSelectedContentTypes}
                sdk={sdk}
                initialSelectedIds={parameters.trackedContentTypes}
              />
              <FormControl.HelpText>
                Select content types to display in the publication trends chart. If none are
                selected, all content types will be shown.
              </FormControl.HelpText>
            </FormControl>
          </>
        </Form>
        <Flex flexDirection="column">
          <Heading as="h3" marginBottom="spacingM" marginTop="spacingL">
            Set up
          </Heading>
          <Flex
            flexDirection="row"
            gap="spacingM"
            marginBottom="spacing2Xl"
            justifyContent="space-between">
            <Flex
              flexDirection="column"
              style={{ maxWidth: '400px' }}
              justifyContent="space-between">
              <Paragraph>
                To make this dashboard your default home page, select the gear icon in the top right
                corner of your Contentful navigation.
              </Paragraph>
              <Image
                alt="An image showing Contentful settings dropdown"
                height="257px"
                width="390px"
                style={{
                  border: `1px solid ${tokens.gray300}`,
                  borderRadius: tokens.borderRadiusMedium,
                  boxShadow: '0 3px 6px ${tokens.gray400}',
                }}
                src={gearImage}
              />
            </Flex>
            <Flex
              flexDirection="column"
              style={{ maxWidth: '400px' }}
              justifyContent="space-between">
              <Paragraph>Select "Content Production Dashboard" and click save.</Paragraph>
              <Image
                alt="An image showing Contentful Home location appearance settings"
                height="257px"
                width="400px"
                style={{
                  border: `1px solid ${tokens.gray300}`,
                  borderRadius: tokens.borderRadiusMedium,
                  boxShadow: '0 3px 6px ${tokens.gray400}',
                }}
                src={appearanceImage}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
