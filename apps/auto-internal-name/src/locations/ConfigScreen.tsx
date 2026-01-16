import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  Form,
  Heading,
  Paragraph,
  FormControl,
  TextInput,
  Button,
  Subheading,
} from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import RuleRow from '../components/RuleRow';
import {
  AppInstallationParameters,
  Rule,
  RuleValidationState,
  FieldSelection,
  RuleValidation,
} from '../utils/types';
import { getFieldSelectionsFromContentTypes } from '../utils/rules';

const ConfigScreen = () => {
  const createEmptyRule = () => {
    return {
      id: window.crypto.randomUUID(),
      parentField: null,
      referenceField: null,
    };
  };

  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    separator: '',
    rules: [createEmptyRule()],
  });
  const [rulesValidations, setRulesValidations] = useState<RuleValidationState>({});
  const [availableFields, setAvailableFields] = useState<FieldSelection[]>([]);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const newRulesValidations: RuleValidationState = {};
    parameters.rules.forEach((rule) => {
      const ruleValidation: RuleValidation = {
        parentFieldError: false,
        referenceFieldError: false,
        parentFieldErrorMessage: '',
        referenceFieldErrorMessage: '',
      };
      if (!rule.parentField) {
        ruleValidation.parentFieldError = true;
        ruleValidation.parentFieldErrorMessage = 'Parent field is required';
      }
      if (!rule.referenceField) {
        ruleValidation.referenceFieldError = true;
        ruleValidation.referenceFieldErrorMessage = 'Reference field is required';
      }
      const referenceKey = rule.referenceField?.fieldUniqueId;
      if (
        referenceKey &&
        parameters.rules.filter((r) => r.referenceField?.fieldUniqueId === referenceKey).length > 1
      ) {
        ruleValidation.referenceFieldError = true;
        ruleValidation.referenceFieldErrorMessage = 'Each field can only be in one reference entry';
      }
      newRulesValidations[rule.id] = ruleValidation;
    });

    setRulesValidations(newRulesValidations);

    const invalidConfigurations =
      !parameters.rules.length ||
      Object.values(newRulesValidations).some(
        (ruleValidation: RuleValidation) =>
          ruleValidation.parentFieldError || ruleValidation.referenceFieldError
      );

    if (invalidConfigurations) {
      sdk.notifier.error('Some fields are missing or invalid');
      return false;
    }

    // TODO: change appereance of fields
    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      try {
        const contentTypesResponse = await sdk.cma.contentType.getMany({}); // TODO: get all

        const contentTypesList = contentTypesResponse.items || [];
        const fields = getFieldSelectionsFromContentTypes(contentTypesList);

        setAvailableFields(fields);
      } catch {
        sdk.notifier.error('Failed to load fields');
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleRuleChange = (rule: Rule) => {
    setParameters((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === rule.id ? rule : r)),
    }));
  };

  const handleAddRule = () => {
    setParameters((prev) => ({
      ...prev,
      rules: [...prev.rules, createEmptyRule()],
    }));
  };

  const handleRuleDelete = (ruleId: string) => {
    setParameters((prev) => ({
      ...prev,
      rules: prev.rules.filter((rule) => rule.id !== ruleId),
    }));
  };

  return (
    <Form>
      <Flex
        className={styles.container}
        flexDirection="column"
        alignItems="flex-start"
        gap="spacingXl">
        <Box>
          <Heading as="h2" marginBottom="spacingS">
            Set up Auto-prefix
          </Heading>
          <Paragraph>
            This app automatically adds the parent entry&apos;s name as a prefix to your reference
            titles, helping maintain a clear naming taxonomy and improving discoverability. Select
            the parent field and a separator -the parent&apos;s name will be applied as a prefix to
            the reference name.
          </Paragraph>
        </Box>

        <Flex flexDirection="column" gap="spacingL" fullWidth>
          <Subheading marginBottom="none">Configure</Subheading>

          <Flex flexDirection="column" gap="spacingXs">
            <Flex flexDirection="row" gap="spacingXl" alignItems="flex-start" fullWidth>
              <Box style={{ flex: 1 }}>
                <Paragraph fontWeight="fontWeightDemiBold" marginBottom="spacing2Xs">
                  Select the parent field
                </Paragraph>
                <Paragraph>
                  The parent field name will be used as the prefix on the reference name.
                </Paragraph>
              </Box>
              <Box style={{ flex: 1 }}>
                <Paragraph fontWeight="fontWeightDemiBold" marginBottom="spacing2Xs">
                  Select reference entries
                </Paragraph>
                <Paragraph>
                  Select the references of your parent content type that you wish to prefix with the
                  parent field name.
                </Paragraph>
              </Box>
            </Flex>

            <Flex flexDirection="column" gap="spacingXs">
              {parameters.rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  availableFields={availableFields}
                  validation={rulesValidations[rule.id]}
                  onRuleChange={handleRuleChange}
                  onRuleDelete={handleRuleDelete}
                />
              ))}

              <Box>
                <Button
                  startIcon={<PlusIcon />}
                  variant="secondary"
                  size="small"
                  onClick={handleAddRule}>
                  Add auto-prefix
                </Button>
              </Box>
            </Flex>
          </Flex>

          <FormControl id="separator">
            <FormControl.Label marginBottom="spacingS">Separator</FormControl.Label>
            <TextInput
              value={parameters.separator}
              onChange={(e) => setParameters((prev) => ({ ...prev, separator: e.target.value }))}
            />
            <FormControl.HelpText marginTop="spacingS">
              The separator can be any character or symbol and will append to the entry name.
            </FormControl.HelpText>
          </FormControl>
        </Flex>
      </Flex>
    </Form>
  );
};

export default ConfigScreen;
