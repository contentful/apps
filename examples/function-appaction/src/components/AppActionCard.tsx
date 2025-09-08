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
import { ActionResultType } from '../locations/Page';
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
      const result = await sdk.cma.appActionCall.createWithResponse(
        {
          organizationId: sdk.ids.organization,
          appDefinitionId: sdk.ids.app || '',
          appActionId: action.sys.id,
        },
        {
          parameters: actionParameters[action.sys.id] || {},
        }
      );

      const timestamp = new Date().toLocaleString();

      setActionResults(() => [
        {
          success: true,
          data: result,
          timestamp,
          actionId: action.sys.id,
          parameters: actionParameters[action.sys.id] || {},
        },
        ...actionResults,
      ]);
    } catch (error) {
      const timestamp = new Date().toLocaleString();
      setActionResults(() => [
        {
          success: false,
          error,
          timestamp,
          actionId: action.sys.id,
          parameters: actionParameters[action.sys.id] || {},
        },
        ...actionResults,
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
    const requiredParameters =
      'parameters' in action ? action.parameters?.filter((param) => param.required) : [];

    const hasEmptyRequiredParameters = requiredParameters.find((param) => {
      const paramValue = actionParameters[action.sys.id]?.[param.id];
      if (!paramValue) {
        return true;
      } else {
        return false;
      }
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
