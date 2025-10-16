import { PageAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Checkbox,
  CopyButton,
  Flex,
  FormControl,
  SectionHeading,
  Stack,
  Subheading,
  Text,
  TextInput,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppActionCallProps, AppActionProps } from 'contentful-management';
import { useState } from 'react';
import ActionResult from './ActionResult';
import { styles } from './AppActionCard.styles';
import Forma36Form from './rjsf/Forma36Form';
import validator from '@rjsf/validator-ajv8';
import type { IChangeEvent } from '@rjsf/core';

interface Props {
  action: AppActionProps;
}

const AppActionCard = (props: Props) => {
  const [appActionCalls, setAppActionCalls] = useState<AppActionCallProps[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionParameters, setActionParameters] = useState<any>({});
  const [schemaErrorsByAction, setSchemaErrorsByAction] = useState<Record<string, number>>({});

  const sdk = useSDK<PageAppSDK>();
  const { action } = props;

  const callAction = async (action: AppActionProps) => {
    setLoadingAction(action.sys.id);
    try {
      const appActionCallWithResult = await sdk.cma.appActionCall.createWithResult(
        {
          appDefinitionId: sdk.ids.app || '',
          appActionId: action.sys.id,
        },
        {
          parameters: actionParameters[action.sys.id] || {},
        }
      );

      setAppActionCalls((prev) => [appActionCallWithResult, ...prev]);
    } catch (error) {
      sdk.notifier.error(`Failed to call action: ${error}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const renderParameterInput = (parameter: any, actionId: string) => {
    const parameterValue = actionParameters[actionId]?.[parameter.id] || '';

    switch (parameter.type) {
      case 'Boolean':
        return (
          <Checkbox
            isChecked={parameterValue}
            onChange={(e) =>
              setActionParameters({
                ...actionParameters,
                [actionId]: {
                  ...actionParameters[actionId],
                  [parameter.id]: e.target.checked,
                },
              })
            }>
            {parameter.description}
          </Checkbox>
        );

      case 'Number':
        return (
          <TextInput
            type="number"
            value={parameterValue}
            onChange={(e) =>
              setActionParameters({
                ...actionParameters,
                [actionId]: {
                  ...actionParameters[actionId],
                  [parameter.id]: Number(e.target.value),
                },
              })
            }
            placeholder={parameter.description}
          />
        );

      default:
        return (
          <TextInput
            value={parameterValue}
            onChange={(e) =>
              setActionParameters({
                ...actionParameters,
                [actionId]: {
                  ...actionParameters[actionId],
                  [parameter.id]: e.target.value,
                },
              })
            }
            placeholder={parameter.description}
          />
        );
    }
  };

  const isButtonDisabled = () => {
    const actionId = action.sys.id;
    const formData = actionParameters[actionId] || {};

    const hasSchema = action.parametersSchema;
    if (hasSchema) {
      const schema = action.parametersSchema;
      const requiredKeys: string[] = Array.isArray(schema?.required) ? schema.required : [];
      const hasEmptyRequired = requiredKeys.some((key) => {
        const value = formData?.[key];
        if (value === undefined || value === null) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (typeof value === 'number' && Number.isNaN(value)) return true;
        return false;
      });
      const hasErrors = Boolean(schemaErrorsByAction[actionId]);
      return hasErrors || hasEmptyRequired;
    }

    const customAction = action as unknown as {
      parameters?: Array<{ id: string; required?: boolean }>;
    };
    const requiredParameters = customAction.parameters?.filter((param) => param.required) || [];
    const hasEmptyRequiredParameters = requiredParameters.some((param) => {
      const paramValue = formData?.[param.id];
      return paramValue === undefined || paramValue === null || paramValue === '';
    });

    return Boolean(hasEmptyRequiredParameters);
  };

  return (
    <Box className={styles.card}>
      <Flex justifyContent="space-between" alignItems="center">
        <Stack spacing="spacing2Xs" flexDirection="column" alignItems="flex-start">
          <Subheading marginBottom="none">{action.name}</Subheading>
          <div className={styles.sysId}>
            <Text fontColor="gray600" marginRight="spacing2Xs">
              {props.action.category} ·
            </Text>
            <Text fontColor="gray600" fontWeight="fontWeightMedium" marginRight="spacing2Xs">
              ID
            </Text>
            <Text fontColor="gray600" className={styles.id}>
              {props.action.sys.id}{' '}
            </Text>
            <CopyButton className={styles.copyButton} value={props.action.sys.id} />
          </div>
        </Stack>
        <Box>
          <Button
            isDisabled={isButtonDisabled()}
            variant="primary"
            onClick={() => callAction(action)}
            isLoading={loadingAction === action.sys.id}>
            Call Action
          </Button>
        </Box>
      </Flex>
      {action.parametersSchema ? (
        <Box marginTop="spacingS">
          <Box marginBottom="spacingS">
            <SectionHeading as="h4">Parameters</SectionHeading>
          </Box>
          <Forma36Form
            schema={action.parametersSchema}
            formData={actionParameters[action.sys.id] || {}}
            validator={validator}
            liveValidate
            showErrorList={false}
            uiSchema={{ 'ui:submitButtonOptions': { norender: true } }}
            onChange={(e: IChangeEvent<Record<string, unknown>>) => {
              setActionParameters({
                ...actionParameters,
                [action.sys.id]: e.formData,
              });
              const errorCount = Array.isArray(e.errors) ? e.errors.length : 0;
              setSchemaErrorsByAction({
                ...schemaErrorsByAction,
                [action.sys.id]: errorCount,
              });
            }}>
            <></>
          </Forma36Form>
        </Box>
      ) : Array.isArray((action as any).parameters) &&
        (action as { parameters: any[] }).parameters.length ? (
        <Box marginTop="spacingS">
          <Box marginBottom="spacingM">
            <Subheading as="h4">Parameters</Subheading>
          </Box>
          {(action as { parameters: any[] }).parameters.map((parameter) => (
            <FormControl isRequired={parameter.required} key={`${action.sys.id}-${parameter.id}`}>
              <FormControl.Label>{parameter.name || parameter.id}</FormControl.Label>
              {renderParameterInput(parameter, action.sys.id)}
            </FormControl>
          ))}
        </Box>
      ) : null}

      {appActionCalls
        .filter(
          (appActionCallWithResult) => appActionCallWithResult.sys.action.sys.id === action.sys.id
        )
        .map((appActionCallWithResult) => (
          <ActionResult
            appActionCall={appActionCallWithResult}
            key={`${appActionCallWithResult.sys.createdAt}`}
          />
        ))}
    </Box>
  );
};

export default AppActionCard;
