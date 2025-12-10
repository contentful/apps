import React, { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Flex,
  FormControl,
  Switch,
  Text,
  Paragraph,
  TextInput,
  Image,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import ContentTypeMultiSelect, { ContentType } from '../components/ContentTypeMultiSelect';
import { VALIDATION_RANGES } from '../utils/consts';
import { ValidationErrors } from '../utils/types';
import gearImage from '../assets/gear.png';
import appearanceImage from '../assets/appearance.png';
import { styles } from './ConfigScreen.styles';

export interface AppInstallationParameters {
  trackedContentTypes?: string[];
  needsUpdateMonths?: number;
  recentlyPublishedDays?: number;
  showUpcomingReleases?: boolean;
  timeToPublishDays?: number;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    setValidationErrors({});

    const errors = getErrors(parameters);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      sdk.notifier.error('Please fill in all required fields with valid values before saving.');
      return false;
    }

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
      } else {
        setParameters({
          needsUpdateMonths: VALIDATION_RANGES.needsUpdateMonths.min,
          recentlyPublishedDays: VALIDATION_RANGES.recentlyPublishedDays.min,
          timeToPublishDays: VALIDATION_RANGES.timeToPublishDays.min,
        });
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const getErrors = (params: AppInstallationParameters): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (params.needsUpdateMonths === undefined) {
      errors.needsUpdateMonths = 'Needs update months is required';
    } else if (isValueOutOfRange(params.needsUpdateMonths, VALIDATION_RANGES.needsUpdateMonths)) {
      errors.needsUpdateMonths = `Needs update months must be between ${VALIDATION_RANGES.needsUpdateMonths.min} and ${VALIDATION_RANGES.needsUpdateMonths.max}`;
    }

    if (params.recentlyPublishedDays === undefined) {
      errors.recentlyPublishedDays = 'Recently published days is required';
    } else if (
      isValueOutOfRange(params.recentlyPublishedDays, VALIDATION_RANGES.recentlyPublishedDays)
    ) {
      errors.recentlyPublishedDays = `Recently published days must be between ${VALIDATION_RANGES.recentlyPublishedDays.min} and ${VALIDATION_RANGES.recentlyPublishedDays.max}`;
    }

    if (params.timeToPublishDays === undefined) {
      errors.timeToPublishDays = 'Time to publish days is required';
    } else if (isValueOutOfRange(params.timeToPublishDays, VALIDATION_RANGES.timeToPublishDays)) {
      errors.timeToPublishDays = `Time to publish days must be between ${VALIDATION_RANGES.timeToPublishDays.min} and ${VALIDATION_RANGES.timeToPublishDays.max}`;
    }

    return errors;
  };

  const isValueOutOfRange = (value: number, range: { min: number; max: number }): boolean => {
    return value < range.min || value > range.max;
  };

  const handleInputWithRangeValidation = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: 'needsUpdateMonths' | 'recentlyPublishedDays' | 'timeToPublishDays'
  ) => {
    const value = e.target.value;
    let numValue: number | undefined = parseInt(value, 10);

    if (isNaN(numValue)) {
      numValue = undefined;
    }

    setParameters((prev) => ({
      ...prev,
      [field]: numValue,
    }));
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
      <Flex flexDirection="column" style={styles.container}>
        <Form>
          <Heading marginBottom="spacingM">Set up Content Production Dashboard</Heading>
          <Paragraph marginBottom="spacingL">
            Get insight into your content lifecycle by tracking production volume, creation time,
            and when content needs updates with the Content Production Dashboard.
          </Paragraph>

          <Heading as="h3" marginBottom="spacingM" marginTop="spacingL">
            Configure app
          </Heading>
          <Text as="p" marginBottom="spacingL" fontSize="fontSizeM">
            Configure the time periods and display options the dashboard uses to calculate and
            present your content metrics.
          </Text>

          <>
            <FormControl
              marginBottom="spacingL"
              isRequired
              isInvalid={!!validationErrors.needsUpdateMonths}>
              <FormControl.Label>
                Content &quot;Needs update&quot; time threshold (months)
              </FormControl.Label>
              <TextInput
                id="needs-update-months"
                name="needs-update-months"
                type="number"
                value={parameters.needsUpdateMonths?.toString() || ''}
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

            <FormControl
              marginBottom="spacingL"
              isRequired
              isInvalid={!!validationErrors.recentlyPublishedDays}>
              <FormControl.Label>
                &quot;Recently published&quot; time period (days)
              </FormControl.Label>
              <TextInput
                id="recently-published-days"
                name="recently-published-days"
                type="number"
                value={parameters.recentlyPublishedDays?.toString() || ''}
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

            <FormControl
              marginBottom="spacingL"
              isRequired
              isInvalid={!!validationErrors.timeToPublishDays}>
              <FormControl.Label>Time to publish threshold (days)</FormControl.Label>
              <TextInput
                id="time-to-publish-days"
                name="time-to-publish-days"
                type="number"
                value={parameters.timeToPublishDays?.toString() || ''}
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
                Show &quot;Upcoming release&quot; section
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
          <Flex flexDirection="row" gap="spacing2Xl" marginBottom="spacing2Xl">
            <Flex flexDirection="column" style={styles.setupColumn} justifyContent="space-between">
              <Paragraph>
                To make this dashboard your default home page, select the gear icon in the top right
                corner of your Contentful navigation.
              </Paragraph>
              <Image
                alt="An image showing Contentful settings dropdown"
                height="257px"
                width="390px"
                style={styles.image}
                src={gearImage}
              />
            </Flex>
            <Flex flexDirection="column" style={styles.setupColumn} justifyContent="space-between">
              <Paragraph>Select &quot;Content Production Dashboard&quot; and click save.</Paragraph>
              <Image
                alt="An image showing Contentful Home location appearance settings"
                height="257px"
                width="400px"
                style={styles.image}
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
