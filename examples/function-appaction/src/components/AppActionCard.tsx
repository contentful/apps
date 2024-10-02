import { PageAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  FormControl,
  Pill,
  Text,
  TextInput,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppActionProps } from 'contentful-management';
import { useState } from 'react';
import { ActionResultType } from '../locations/Page';
import ActionResult from './ActionResult';

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

  return (
    <Card key={action.sys.id}>
      <Flex flexDirection="column" justifyContent="space-between" style={{ height: '100%' }}>
        <Box>
          <Pill style={{ float: 'right' }} label={action.category} />
          <Text fontSize="fontSizeL">{action.name}</Text>
          <Text as="h6" fontSize="fontSizeS">
            {action.description}
          </Text>
          <small>
            Created at <b>{new Date(action.sys.createdAt).toLocaleString()}</b>
          </small>
        </Box>
        {(action as { parameters: any[] }).parameters.map((parameter) => (
          <FormControl
            isRequired={parameter.required}
            isInvalid={parameter.required && !actionParameters[action.sys.id]?.[parameter.id]}
            style={{ marginBottom: '6px', marginTop: '4px' }}>
            <FormControl.Label>{parameter.name || parameter.id}</FormControl.Label>
            {renderParameterInput(parameter, action.sys.id)}
          </FormControl>
        ))}
        <Button
          isDisabled={
            !actionParameters[action.sys.id] ||
            Object.values(actionParameters[action.sys.id]).some((value) => !value)
          }
          isFullWidth
          variant="secondary"
          onClick={() => callAction(action)}
          isLoading={loadingAction === action.sys.id}
          style={{ marginTop: '8px' }}>
          Call Action
        </Button>

        {actionResults
          .filter((result) => result.actionId === action.sys.id)
          .map((result) => (
            <ActionResult actionResult={result} />
          ))}
      </Flex>
    </Card>
  );
};

export default AppActionCard;
