import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Paragraph,
  Flex,
  Checkbox,
  FormControl,
  Note,
} from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';
import { IconWeight, ICON_WEIGHTS, ICON_WEIGHT_LABELS } from '../types/icon';
import type { AppInstallationParameters } from '../types/parameters';
import { parseEnabledWeights, serializeEnabledWeights } from '../types/parameters';

const styles = {
  container: css({
    margin: '80px auto',
    maxWidth: '800px',
    padding: '0 20px',
  }),
  checkboxGroup: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '8px',
  }),
};

const ConfigScreen = () => {
  const [enabledWeights, setEnabledWeights] = useState<IconWeight[]>(['regular']);
  const sdk = useSDK<ConfigAppSDK>();

  useEffect(() => {
    sdk.app.onConfigure(async () => {
      if (enabledWeights.length === 0) {
        sdk.notifier.error('Please select at least one icon weight.');
        return false;
      }

      const currentState = await sdk.app.getCurrentState();

      return {
        parameters: {
          enabledWeights: serializeEnabledWeights(enabledWeights),
        } as AppInstallationParameters,
        targetState: currentState,
      };
    });
  }, [sdk, enabledWeights]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters<AppInstallationParameters>();
      const parsedWeights = parseEnabledWeights(currentParameters?.enabledWeights);

      if (parsedWeights.length > 0) {
        setEnabledWeights(parsedWeights);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleWeightToggle = useCallback((weight: IconWeight) => {
    setEnabledWeights((prev) => {
      if (prev.includes(weight)) {
        return prev.filter((w) => w !== weight);
      }
      return [...prev, weight];
    });
  }, []);

  return (
    <Flex flexDirection="column" className={styles.container}>
      <Form>
        <Heading>Phosphor Icons Configuration</Heading>
        <Paragraph>
          Configure which icon weights are available for content editors to choose from.
        </Paragraph>

        <FormControl marginTop="spacingL">
          <FormControl.Label>Enabled Icon Weights</FormControl.Label>
          <FormControl.HelpText>
            Select at least one weight. Content editors will only be able to select icons in these
            weights.
          </FormControl.HelpText>

          <div className={styles.checkboxGroup}>
            {ICON_WEIGHTS.map((weight) => (
              <Checkbox
                key={weight}
                id={`weight-${weight}`}
                isChecked={enabledWeights.includes(weight)}
                onChange={() => handleWeightToggle(weight)}>
                {ICON_WEIGHT_LABELS[weight]}
              </Checkbox>
            ))}
          </div>
        </FormControl>

        {enabledWeights.length === 0 && (
          <Note variant="warning" marginTop="spacingM">
            Please select at least one icon weight.
          </Note>
        )}

        <Note variant="neutral" marginTop="spacingL">
          Duotone icons are not available in this app.
        </Note>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
