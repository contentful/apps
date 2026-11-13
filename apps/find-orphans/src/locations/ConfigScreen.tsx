import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  Subheading,
  TextInput,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppInstallationParameters, DEFAULT_PARAMETERS } from '../parameters';

type NumberParameterId = 'maxCandidates' | 'batchSize';

interface NumberFieldProps {
  id: NumberParameterId;
  label: string;
  helpText: string;
  placeholder: string;
  value: string;
  onChange: (id: NumberParameterId, value: string) => void;
}

const NumberField = ({ id, label, helpText, placeholder, value, onChange }: NumberFieldProps) => (
  <FormControl id={id} isRequired isInvalid={value !== '' && Number.parseInt(value, 10) < 1}>
    <FormControl.Label>{label}</FormControl.Label>
    {/* The Box keeps the input on its own line at a sensible width instead
        of stretching a number field across the whole form. */}
    <Box style={{ maxWidth: '240px' }}>
      <TextInput
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(id, event.target.value)}
        min={1}
      />
    </Box>
    <FormControl.HelpText>{helpText}</FormControl.HelpText>
  </FormControl>
);

// Number inputs are kept as strings while editing, so a cleared field stays
// cleared instead of snapping to 0.
interface FormValues {
  maxCandidates: string;
  batchSize: string;
}

// Human-readable names for validation messages, keyed by parameter id.
const FIELD_LABELS: Record<NumberParameterId, string> = {
  maxCandidates: 'Maximum entries per scan',
  batchSize: 'Concurrent API requests',
};

const NUMBER_PARAMETER_IDS: NumberParameterId[] = ['maxCandidates', 'batchSize'];

// Stored parameters may be partial (e.g. the app was installed before a
// parameter existed), so each missing value falls back to its default. This
// also seeds the fresh-install form, letting the user save without typing.
const toFormValues = (parameters: Partial<AppInstallationParameters>): FormValues => ({
  maxCandidates: String(parameters.maxCandidates ?? DEFAULT_PARAMETERS.maxCandidates),
  batchSize: String(parameters.batchSize ?? DEFAULT_PARAMETERS.batchSize),
});

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  // The form starts pre-filled with the recommended defaults so a fresh
  // install is a single click; validation on save still requires each field.
  const [values, setValues] = useState<FormValues>(toFormValues(DEFAULT_PARAMETERS));

  // Called by Contentful when the user clicks "Save" on the app configuration
  // screen. Returning false aborts the save and keeps the dialog open.
  const onConfigure = useCallback(async () => {
    const parsed = {} as Record<NumberParameterId, number>;
    for (const key of NUMBER_PARAMETER_IDS) {
      const parsedValue = Number.parseInt(values[key], 10);
      // Empty fields fail this check too: the parameters are required, so
      // there is no silent fallback to defaults on save.
      if (Number.isNaN(parsedValue) || parsedValue < 1) {
        sdk.notifier.error(`"${FIELD_LABELS[key]}" is required and must be a positive number.`);
        return false;
      }
      parsed[key] = parsedValue;
    }
    // Enforce the CMA rate limit of 7 requests/second explicitly rather than
    // silently clamping a higher value on save.
    if (parsed.batchSize > 7) {
      sdk.notifier.error(`"${FIELD_LABELS.batchSize}" must be between 1 and 7.`);
      return false;
    }
    const parameters: AppInstallationParameters = parsed;
    // Preserve the current location assignments (EditorInterface state)
    // instead of resetting them on every save.
    const currentState = await sdk.app.getCurrentState();
    return { parameters, targetState: currentState };
  }, [values, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    const initialize = async () => {
      // getParameters returns null when the app has never been configured;
      // in that case the form keeps the pre-filled defaults.
      const current = await sdk.app.getParameters();
      if (current) {
        setValues(toFormValues(current as Partial<AppInstallationParameters>));
      }
      // Without setReady the config screen stays on a loading spinner forever.
      sdk.app.setReady();
    };
    initialize();
  }, [sdk]);

  const handleChange = (id: NumberParameterId, value: string) => {
    setValues((previous) => ({ ...previous, [id]: value }));
  };

  return (
    <Flex justifyContent="center">
      <Box
        marginTop="spacing2Xl"
        marginBottom="spacing2Xl"
        style={{ maxWidth: '768px', width: '100%' }}>
        <Heading marginBottom="spacingS">Set up Find Orphans</Heading>
        <Paragraph>
          Find Orphans scans this space for orphaned draft entries and media assets — items with no
          title (the signature of an entry created by mistake from a reference field) or items that
          no entry references — and lets you review or archive them from one page.
        </Paragraph>

        <Subheading marginTop="spacingXl" marginBottom="spacing2Xs">
          Scan limits
        </Subheading>
        <Paragraph marginBottom="spacingM">
          These settings apply to everyone in this space. The recommended values are pre-filled, so
          you can install as-is and tune them later.
        </Paragraph>

        <Form>
          <NumberField
            id="maxCandidates"
            label={FIELD_LABELS.maxCandidates}
            helpText="The scan stops after this many draft entries and assets, to stay friendly to API rate limits."
            placeholder={String(DEFAULT_PARAMETERS.maxCandidates)}
            value={values.maxCandidates}
            onChange={handleChange}
          />
          <NumberField
            id="batchSize"
            label={FIELD_LABELS.batchSize}
            helpText="How many CMA requests run at once while scanning and archiving (at most 7, the CMA rate limit per second)."
            placeholder={String(DEFAULT_PARAMETERS.batchSize)}
            value={values.batchSize}
            onChange={handleChange}
          />
        </Form>

        <Subheading marginTop="spacingXl" marginBottom="spacing2Xs">
          Getting started
        </Subheading>
        <Paragraph>
          After installing, open the app from the Apps menu, run a scan, then review each entry or
          archive the selected ones in bulk.
        </Paragraph>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
