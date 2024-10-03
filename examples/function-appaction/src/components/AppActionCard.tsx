import { PageAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  Paragraph,
  Subheading,
  Text,
  TextInput,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppActionProps } from 'contentful-management';
import { useState } from 'react';
import { ActionResultType } from '../locations/Page';
import ActionResult from './ActionResult';
import tokens from '@contentful/f36-tokens';

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
          parameters: actionParameters[action.sys.id],
        }
      );

      const timestamp = new Date().toLocaleString();

      setActionResults((prevResults) => [
        ...prevResults,
        { success: true, data: result, timestamp, actionId: action.sys.id },
      ]);
    } catch (error) {
      const timestamp = new Date().toLocaleString();
      setActionResults((prevResults) => [
        ...prevResults,
        { success: false, error, timestamp, actionId: action.sys.id },
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
    <Box
      style={{
        height: 'auto',
        margin: `${tokens.spacingL} auto`,
        maxWidth: '900px',
        backgroundColor: tokens.colorWhite,
        borderRadius: '6px',
        border: `1px solid ${tokens.gray300}`,
        zIndex: 2,
        padding: `${tokens.spacingL}`,
      }}>
      <Flex justifyContent="space-between">
        <Flex flexDirection="column">
          <Subheading marginBottom="none">{action.name}</Subheading>
          <Text>{action.description}</Text>
          <Text>{action.category} category</Text>
        </Flex>
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
          <Paragraph style={{ fontWeight: tokens.fontWeightDemiBold }}>Parameters</Paragraph>
          {(action as { parameters: any[] }).parameters.map((parameter) => (
            <FormControl
              isRequired={parameter.required}
              style={{ marginBottom: '6px', marginTop: '4px' }}>
              <FormControl.Label>{parameter.name || parameter.id}</FormControl.Label>
              {renderParameterInput(parameter, action.sys.id)}
            </FormControl>
          ))}

          {actionResults
            .filter((result) => result.actionId === action.sys.id)
            .map((result) => (
              <ActionResult actionResult={result} />
            ))}
        </Box>
      ) : null}
    </Box>
  );
};

export default AppActionCard;
