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
import {
  NEEDS_UPDATE_MONTHS_RANGE,
  RECENTLY_PUBLISHED_DAYS_RANGE,
  TIME_TO_PUBLISH_DAYS_RANGE,
} from '../utils/consts';
import gearImage from '../assets/gear.png';
import appearanceImage from '../assets/appearance.png';
import { styles } from './ConfigScreen.styles';
import { Validator } from '../utils/Validator';

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
  const sdk = useSDK<ConfigAppSDK>();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validationErrors = (): boolean => {
    const newErrors: Record<string, string> = {};
    Validator.isWithinRange(
      newErrors,
      parameters.needsUpdateMonths,
      'needsUpdateMonths',
      'Needs update months',
      NEEDS_UPDATE_MONTHS_RANGE
    );
    Validator.isWithinRange(
      newErrors,
      parameters.recentlyPublishedDays,
      'recentlyPublishedDays',
      'Recently published days',
      RECENTLY_PUBLISHED_DAYS_RANGE
    );
    Validator.isWithinRange(
      newErrors,
      parameters.timeToPublishDays,
      'timeToPublishDays',
      'Time to publish days',
      TIME_TO_PUBLISH_DAYS_RANGE
    );

    setErrors(newErrors);
    return Validator.hasErrors(newErrors);
  };

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const hasErrors = validationErrors();

    if (hasErrors) {
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
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleOnChangeInput = (
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

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
            <FormControl marginBottom="spacingL" isRequired isInvalid={!!errors.needsUpdateMonths}>
              <FormControl.Label>
                Content &quot;Needs update&quot; time threshold (months)
              </FormControl.Label>
              <TextInput
                id="needs-update-months"
                name="needs-update-months"
                type="number"
                value={parameters.needsUpdateMonths?.toString() || ''}
                onChange={(event) => handleOnChangeInput(event, 'needsUpdateMonths')}
              />
              {errors.needsUpdateMonths && (
                <FormControl.ValidationMessage>
                  {errors.needsUpdateMonths}
                </FormControl.ValidationMessage>
              )}
              <FormControl.HelpText>
                Content will be marked as &quot;Needs update&quot; when it hasn&apos;t been updated
                for this amount of time. Range: {NEEDS_UPDATE_MONTHS_RANGE.min}-
                {NEEDS_UPDATE_MONTHS_RANGE.max} months.
              </FormControl.HelpText>
            </FormControl>

            <FormControl
              marginBottom="spacingL"
              isRequired
              isInvalid={!!errors.recentlyPublishedDays}>
              <FormControl.Label>
                &quot;Recently published&quot; time period (days)
              </FormControl.Label>
              <TextInput
                id="recently-published-days"
                name="recently-published-days"
                type="number"
                value={parameters.recentlyPublishedDays?.toString() || ''}
                onChange={(event) => handleOnChangeInput(event, 'recentlyPublishedDays')}
              />
              {errors.recentlyPublishedDays && (
                <FormControl.ValidationMessage>
                  {errors.recentlyPublishedDays}
                </FormControl.ValidationMessage>
              )}
              <FormControl.HelpText>
                Content will be considered &quot;Recently published&quot; if it was published within
                this time period. Range: {RECENTLY_PUBLISHED_DAYS_RANGE.min}-
                {RECENTLY_PUBLISHED_DAYS_RANGE.max} days.
              </FormControl.HelpText>
            </FormControl>

            <FormControl marginBottom="spacingL" isRequired isInvalid={!!errors.timeToPublishDays}>
              <FormControl.Label>Time to publish threshold (days)</FormControl.Label>
              <TextInput
                id="time-to-publish-days"
                name="time-to-publish-days"
                type="number"
                value={parameters.timeToPublishDays?.toString() || ''}
                onChange={(event) => handleOnChangeInput(event, 'timeToPublishDays')}
              />
              {errors.timeToPublishDays && (
                <FormControl.ValidationMessage>
                  {errors.timeToPublishDays}
                </FormControl.ValidationMessage>
              )}
              <FormControl.HelpText>
                The time period to calculate average time to publish metrics. Range:{' '}
                {TIME_TO_PUBLISH_DAYS_RANGE.min}-{TIME_TO_PUBLISH_DAYS_RANGE.max} days.
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
