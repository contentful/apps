import { PageAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Checkbox,
  CopyButton,
  Flex,
  FormControl,
  Stack,
  Subheading,
  Text,
  TextInput,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppActionProps } from 'contentful-management';
import { useState } from 'react';
import { ActionResultData, ActionResultType } from '../locations/Page';
import ActionResult from './ActionResult';
import { styles } from './AppActionCard.styles';

interface Props {
  action: AppActionProps;
}

const AppActionCard = (props: Props) => {
  const [actionResults, setActionResults] = useState<ActionResultType[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionParameters, setActionParameters] = useState<any>({});

  const sdk = useSDK<PageAppSDK>();
  const { action } = props;

  const callAction = async (action: AppActionProps) => {
    setLoadingAction(action.sys.id);
    try {
      const result = (await sdk.cma.appActionCall.createWithResult(
        {
          appDefinitionId: sdk.ids.app || '',
          appActionId: action.sys.id,
        },
        {
          parameters: actionParameters[action.sys.id] || {},
        }
      )) as unknown as ActionResultData;

      const timestamp = new Date().toLocaleString();
      const call: any = result as any;
      const base = { timestamp, actionId: action.sys.id } as const;

      if (call?.status === 'succeeded') {
        setActionResults((prev) => [{ success: true, data: call, ...base }, ...prev]);
      } else if (call?.status === 'failed') {
        setActionResults((prev) => [
          { success: false, error: call?.error || new Error('App action failed'), ...base },
          ...prev,
        ]);
      } else {
        setActionResults((prev) => [
          { success: false, error: new Error('App action still processing'), ...base },
          ...prev,
        ]);
      }
    } catch (error) {
      const timestamp = new Date().toLocaleString();
      setActionResults((prev) => [
        { success: false, error, timestamp, actionId: action.sys.id },
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
    const parameters = (action as any).parameters as any[] | undefined;
    const requiredParameters = parameters?.filter((param: any) => param.required) ?? [];

    const hasEmptyRequiredParameters = requiredParameters.find((param: any) => {
      const paramValue = actionParameters[action.sys.id]?.[param.id];
      return !paramValue;
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
      {(action as { parameters: any[] }).parameters.length ? (
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
