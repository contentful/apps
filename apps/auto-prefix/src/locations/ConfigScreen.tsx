import { AppState, CMAClient, ConfigAppSDK } from '@contentful/app-sdk';
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
  Grid,
  GridItem,
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
import { ContentTypeProps } from 'contentful-management';
import { createEmptyRule, getFieldSelectionsFromContentTypes } from '../utils/utils';

const ConfigScreen = () => {
  const getAllContentTypes = async (cma: CMAClient): Promise<ContentTypeProps[]> => {
    const allContentTypes: ContentTypeProps[] = [];
    let skip = 0;
    const limit = 1000;
    let fetched: number;

    do {
      const response = await cma.contentType.getMany({
        query: { skip, limit },
      });
      const items = response.items as ContentTypeProps[];
      allContentTypes.push(...items);
      fetched = items.length;
      skip += limit;
    } while (fetched === limit);

    return allContentTypes;
  };

  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    separator: '',
    rules: [createEmptyRule()],
  });
  const [rulesValidations, setRulesValidations] = useState<RuleValidationState>({});
  const [availableFields, setAvailableFields] = useState<FieldSelection[]>([]);

  const validateOnConfigure = () => {
    const newRulesValidations: RuleValidationState = {};
    parameters.rules.forEach((rule) => {
      const ruleValidation: RuleValidation = {
        parentFieldError: false,
        referenceFieldError: false,
        parentFieldErrorMessage: '',
        referenceFieldErrorMessage: '',
      };
      if (!rule.parentField.fieldUniqueId) {
        ruleValidation.parentFieldError = true;
        ruleValidation.parentFieldErrorMessage = 'Parent field is required';
      }
      if (!rule.referenceField.fieldUniqueId) {
        ruleValidation.referenceFieldError = true;
        ruleValidation.referenceFieldErrorMessage = 'Reference field is required';
      }
      const referenceKey = rule.referenceField.fieldUniqueId;
      if (
        referenceKey &&
        parameters.rules.filter((r) => r.referenceField.fieldUniqueId === referenceKey).length > 1
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
    return !invalidConfigurations;
  };

  const addAppToFields = async () => {
    const targetState: { EditorInterface: AppState['EditorInterface'] } = { EditorInterface: {} };

    for (const rule of parameters.rules) {
      const fieldId = rule.referenceField.fieldId;
      const contentTypeId = rule.referenceField.contentTypeId;
      if (fieldId && contentTypeId) {
        targetState.EditorInterface[contentTypeId] = {
          controls: [{ fieldId }],
        };
      }
    }

    return targetState;
  };

  const onConfigure = useCallback(async () => {
    if (!validateOnConfigure()) {
      sdk.notifier.error('Some fields are missing or invalid');
      return false;
    }

    const targetState = await addAppToFields();

    return {
      parameters,
      targetState,
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
        const contentTypesList = await getAllContentTypes(sdk.cma);
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
            <Grid
              className={styles.rulesGrid}
              columns="minmax(0, 1fr) minmax(0, 1fr) auto"
              columnGap="spacingL"
              rowGap="spacingXs">
              <GridItem>
                <Paragraph fontWeight="fontWeightDemiBold" marginBottom="spacing2Xs">
                  Select the parent field
                </Paragraph>
                <Paragraph>
                  The parent field name will be used as the prefix on the reference name.
                </Paragraph>
              </GridItem>
              <GridItem>
                <Paragraph fontWeight="fontWeightDemiBold" marginBottom="spacing2Xs">
                  Select reference entries
                </Paragraph>
                <Paragraph>
                  Select the references of your parent content type that you wish to prefix with the
                  parent field name.
                </Paragraph>
              </GridItem>
              <GridItem />
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
            </Grid>

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
