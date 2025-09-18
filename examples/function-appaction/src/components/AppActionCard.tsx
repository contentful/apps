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
import { AppActionCallRawResponseProps, AppActionProps } from 'contentful-management';
import { useState } from 'react';
import { ActionResultType } from '../locations/Page';
import ActionResult from './ActionResult';
import { styles } from './AppActionCard.styles';
import Forma36Form from './rjsf/Forma36Form';
import validator from '@rjsf/validator-ajv8';

interface Props {
  action: AppActionProps;
}

const AppActionCard = (props: Props) => {
  const [actionResults, setActionResults] = useState<ActionResultType[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionParameters, setActionParameters] = useState<any>({});
  const [schemaErrorsByAction, setSchemaErrorsByAction] = useState<Record<string, number>>({});

  const sdk = useSDK<PageAppSDK>();
  const { action } = props;

  const callAction = async (action: AppActionProps) => {
    setLoadingAction(action.sys.id);
    let response: AppActionCallRawResponseProps | undefined;
    try {
      const result = await sdk.cma.appActionCall.createWithResult(
        {
          appDefinitionId: sdk.ids.app || '',
          appActionId: action.sys.id,
        },
        {
          parameters: actionParameters[action.sys.id] || {},
        }
      );

      const timestamp = new Date().toLocaleString();
      const call = result;
      const callId = call?.sys?.id;
      const base = { timestamp, actionId: action.sys.id, callId } as const;
      if (call.sys.appActionCallResponse) {
        response = await sdk.cma.appActionCall.getResponse({
          appDefinitionId: sdk.ids.app || '',
          appActionId: action.sys.id,
          callId: callId,
        });
      }

      if (call?.status === 'succeeded') {
        setActionResults((prev) => [{ success: true, call, ...base }, ...prev]);
      } else if (call?.status === 'failed') {
        setActionResults((prev) => [
          {
            success: false,
            call,
            response,
            error: call?.error || new Error('App action failed'),
            ...base,
          },
          ...prev,
        ]);
      } else {
        setActionResults((prev) => [
          {
            success: false,
            call,
            response,
            error: new Error('App action still processing'),
            ...base,
          },
          ...prev,
        ]);
      }
    } catch (error) {
      const timestamp = new Date().toLocaleString();
      setActionResults((prev) => [
        { success: false, error, timestamp, actionId: action.sys.id, response },
        ...prev,
      ]);
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
            onChange={(e: any) => {
              setActionParameters({
                ...actionParameters,
                [action.sys.id]: e.formData,
              });
              const errorCount = Array.isArray((e as any).errors) ? (e as any).errors.length : 0;
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

      {actionResults
        .filter((result) => result.actionId === action.sys.id)
        .map((result) => (
          <ActionResult actionResult={result} key={`${result.timestamp}`} />
        ))}
    </Box>
  );
};

export default AppActionCard;
