import { ConfigAppSDK } from '@contentful/app-sdk';
import { Box, Flex, Form, Heading, Paragraph } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import OverrideSection from '../components/OverrideSection';
import ConfigureSection from '../components/ConfigureSection';
import { AppInstallationParameters, OverrideState, Override } from '../utils/types';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    separator: '',
    sourceFieldId: '',
    overrides: [],
  });

  const [isSourceFieldMissing, setIsSourceFieldMissing] = useState<boolean>(false);
  const [overridesAreInvalid, setOverridesAreInvalid] = useState<OverrideState>({});

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    setIsSourceFieldMissing(!parameters.sourceFieldId);

    const overridesAreInvalid: OverrideState = {};
    parameters.overrides.forEach((override) => {
      overridesAreInvalid[override.id] = {
        isContentTypeMissing: !override.contentTypeId,
        isFieldMissing: !override.fieldId,
      };
    });
    setOverridesAreInvalid(overridesAreInvalid);

    const invalidOverrides = parameters.overrides.some(
      (override) => !override.contentTypeId || !override.fieldId
    );

    if (!parameters.sourceFieldId || invalidOverrides) {
      sdk.notifier.error('Some fields are missing or invalid');
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
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleOverridesChange = (updater: (prev: Override[]) => Override[]) => {
    setParameters((prev) => ({
      ...prev,
      overrides: updater(prev.overrides),
    }));
  };

  return (
    <Form>
      <Flex
        className={styles.container}
        flexDirection="column"
        alignItems="flex-start"
        gap="spacingXl"
        marginTop="spacing2Xl">
        <Box>
          <Heading as="h2" marginBottom="spacingS">
            Set up Auto Internal Name
          </Heading>
          <Paragraph>
            This app allows you to automatically set the name of an entry based on a field from its
            parent entry. Provide the ID of the field you wish to use as the source field on the
            parent.
          </Paragraph>
        </Box>

        <ConfigureSection
          separator={parameters.separator}
          sourceFieldId={parameters.sourceFieldId}
          isSourceFieldMissing={isSourceFieldMissing}
          onSeparatorChange={(value) => setParameters((prev) => ({ ...prev, separator: value }))}
          onSourceFieldIdChange={(fieldId: string) =>
            setParameters((prev) => ({ ...prev, sourceFieldId: fieldId }))
          }
        />

        <OverrideSection
          overrides={parameters.overrides}
          overridesAreInvalid={overridesAreInvalid}
          onOverridesChange={handleOverridesChange}
        />
      </Flex>
    </Form>
  );
};

export default ConfigScreen;
