import { PageAppSDK } from '@contentful/app-sdk';
import {
  Button,
  Card,
  Grid,
  Text,
  Box,
  Flex,
  Subheading,
  Pill,
  TextInput,
  FormControl,
  IconButton,
  Checkbox,
  Accordion,
  Stack,
} from '@contentful/f36-components';
import { PresentationIcon, CycleIcon, CopyIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppActionProps, CollectionProp } from 'contentful-management';
import { useMemo, useState } from 'react';
import EmptyFishbowl from '../components/EmptyFishbowl';
import tokens from '@contentful/f36-tokens';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [appActions, setAppActions] = useState<CollectionProp<AppActionProps>>();
  const [actionResults, setActionResults] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionParameters, setActionParameters] = useState<any>({});
  const [accordionState, setAccordionState] = useState<any>({});

  const borderColor = (success: boolean) => (success ? tokens.colorPositive : tokens.colorNegative);

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
      setAccordionState((prev: any) => ({
        ...prev,
        [`outer-${action.sys.id}-${timestamp}`]: true,
        [`request-${action.sys.id}-${timestamp}`]: false,
        [`response-${action.sys.id}-${timestamp}`]: true,
      }));
    } catch (error) {
      const timestamp = new Date().toLocaleString();
      setActionResults((prevResults) => [
        ...prevResults,
        { success: false, error, timestamp, actionId: action.sys.id },
      ]);
      setAccordionState((prev: any) => ({
        ...prev,
        [`outer-${action.sys.id}-${timestamp}`]: true,
        [`request-${action.sys.id}-${timestamp}`]: false,
        [`response-${action.sys.id}-${timestamp}`]: true,
      }));
    } finally {
      setLoadingAction(null);
    }
  };

  const fetchAppActions = async () => {
    setAppActions(
      await sdk.cma.appAction.getMany({
        organizationId: sdk.ids.organization,
        appDefinitionId: sdk.ids.app || '',
      })
    );
  };

  useMemo(async () => {
    fetchAppActions();
  }, [sdk]);

  const handleExpand = (itemKey: string) => () =>
    setAccordionState((prevState: any) => ({ ...prevState, [itemKey]: true }));

  const handleCollapse = (itemKey: string) => () =>
    setAccordionState((prevState: any) => ({ ...prevState, [itemKey]: false }));

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

  const handleCopy = (text: string, entityDescription: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        sdk.notifier.success(`Copied ${entityDescription || 'item'} to clipboard.`);
      },
      () => {
        sdk.notifier.error(`Failed to copy ${entityDescription || 'item'} to clipboard.`);
      }
    );
  };

  const renderActionResult = (result: any) => {
    const { success, data, error, timestamp, actionId } = result;
    const errorMessage = error?.message ? JSON.parse(error.message) : undefined;
    const statusCode = success ? data?.response?.statusCode : errorMessage?.status || 500;
    const successColor = success ? tokens.colorPositive : tokens.colorNegative;
    const duration =
      new Date(data.responseAt).getMilliseconds() - new Date(timestamp).getMilliseconds();

    return (
      <Accordion key={`${actionId}-${timestamp}`} style={{ marginTop: '20px' }}>
        <Accordion.Item
          title={
            <Text style={{ textAlign: 'left' }}>
              <span style={{ color: successColor, fontWeight: 'bold' }}>
                {success ? 'Success' : 'Failed'} [{statusCode}]
              </span>{' '}
              - {timestamp}
              {data?.request?.function && (
                <Text style={{ marginLeft: '4px' }}>
                  (Function: <strong>{data?.request?.function}</strong>)
                </Text>
              )}
              {!isNaN(duration) && (
                <Text style={{ marginLeft: '4px' }}>
                  Duration: <strong>{duration}</strong> ms
                </Text>
              )}
            </Text>
          }
          isExpanded={accordionState[`outer-${actionId}-${timestamp}`]}
          onExpand={handleExpand(`outer-${actionId}-${timestamp}`)}
          onCollapse={handleCollapse(`outer-${actionId}-${timestamp}`)}>
          <Accordion>
            <Accordion.Item
              title={<Text style={{ textAlign: 'left', fontWeight: 'bold' }}>Request Details</Text>}
              isExpanded={accordionState[`request-${actionId}-${timestamp}`]}
              onExpand={handleExpand(`request-${actionId}-${timestamp}`)}
              onCollapse={handleCollapse(`request-${actionId}-${timestamp}`)}>
              <Stack flexDirection="column" alignItems="left" style={{ marginLeft: '8px' }}>
                <Text>
                  <strong>Request Headers:</strong>{' '}
                  {data?.request?.headers &&
                    Object.entries(data?.request?.headers).map(([key, value]) => (
                      <div style={{ marginLeft: '8px', wordWrap: 'break-word' }} key={key}>
                        <strong>{key}:</strong> {`${value}`}
                      </div>
                    ))}
                </Text>
                <Text>
                  <strong>Request Body:</strong>
                  <Flex alignItems="center" style={{ position: 'relative' }}>
                    <pre
                      style={{
                        minWidth: '100%',
                        overflowX: 'auto',
                        padding: '8px',
                        border: `1px solid ${tokens.gray200}`,
                        borderRadius: '4px',
                        backgroundColor: tokens.gray100,
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                      }}>
                      <code>{JSON.stringify(JSON.parse(data?.request?.body || {}), null, 2)}</code>
                    </pre>
                    <IconButton
                      variant="transparent"
                      icon={<CopyIcon />}
                      aria-label="Copy request body"
                      onClick={() => handleCopy(data?.response?.body || {}, 'request body')}
                      style={{
                        marginLeft: '8px',
                        position: 'absolute',
                        right: '0px',
                        top: '14px',
                      }}
                    />
                  </Flex>
                </Text>
              </Stack>
            </Accordion.Item>

            <Accordion.Item
              title={
                <Text style={{ textAlign: 'left', fontWeight: 'bold' }}>Response Details</Text>
              }
              isExpanded={accordionState[`response-${actionId}-${timestamp}`]}
              onExpand={handleExpand(`response-${actionId}-${timestamp}`)}
              onCollapse={handleCollapse(`response-${actionId}-${timestamp}`)}>
              <Stack flexDirection="column" alignItems="left" style={{ marginLeft: '8px' }}>
                <Text>
                  <strong>Response Body:</strong>
                  <Flex alignItems="center" style={{ position: 'relative' }}>
                    <pre
                      style={{
                        minWidth: '100%',
                        overflowX: 'auto',
                        padding: '8px',
                        border: `1px solid ${tokens.gray200}`,
                        borderRadius: '4px',
                        backgroundColor: tokens.gray100,
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                      }}>
                      <code>{JSON.stringify(JSON.parse(data?.response?.body || {}), null, 2)}</code>
                    </pre>
                    <IconButton
                      variant="transparent"
                      icon={<CopyIcon />}
                      aria-label="Copy response body"
                      onClick={() => handleCopy(data?.response?.body || {}, 'response body')}
                      style={{
                        marginLeft: '8px',
                        position: 'absolute',
                        right: '0px',
                        top: '14px',
                      }}
                    />
                  </Flex>
                </Text>
                <Text>
                  <strong>Response At:</strong> {new Date(data?.responseAt).toLocaleString()}
                </Text>
              </Stack>
            </Accordion.Item>
          </Accordion>
        </Accordion.Item>
      </Accordion>
    );
  };

  return (
    <Box
      style={{
        minHeight: '97vh',
        padding: '20px',
        margin: '20px',
        marginTop: '0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <Box
        style={{
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}>
        <Flex>
          <PresentationIcon style={{ marginRight: '8px' }} size="xlarge" />
          <Text as="h1" fontSize="fontSizeXl">
            <strong>App Actions</strong> <i>Demo Console</i>
            <Subheading>
              An example app for testing{' '}
              <a href="https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/">
                Contentful App Actions
              </a>
            </Subheading>
          </Text>
          <IconButton
            style={{ marginLeft: 'auto' }}
            variant="secondary"
            aria-label="Reload App Actions"
            icon={<CycleIcon />}
            onClick={() => fetchAppActions()}
          />
        </Flex>
      </Box>

      {appActions?.items.length ? (
        <Box
          style={{
            margin: '0 auto',
            flex: 1,
            minWidth: '100%',
          }}>
          <Grid style={{ width: '100%' }} columns="1fr" rowGap="spacingM">
            {appActions.items.map((action) => (
              <Card
                key={action.sys.id}
                style={{
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                  border: `2px solid ${
                    actionResults.find((res) => res.actionId === action.sys.id)
                      ? borderColor(
                          actionResults.find((res) => res.actionId === action.sys.id)?.success
                        )
                      : tokens.glowPrimary
                  }`,
                  height: '100%',
                }}>
                <Flex
                  flexDirection="column"
                  justifyContent="space-between"
                  style={{ height: '100%' }}>
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
                      isInvalid={
                        parameter.required && !actionParameters[action.sys.id]?.[parameter.id]
                      }
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
                    .map((result) => renderActionResult(result))}
                </Flex>
              </Card>
            ))}
          </Grid>
        </Box>
      ) : (
        <Flex
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          style={{ flex: 1 }}>
          <EmptyFishbowl />
          <Text style={{ textAlign: 'center', marginTop: '20px' }}>
            Uh oh, there's nothing here. It's time to create an App Action!
            <br />
            Navigate to your app's definition in the Contentful Web App and create a new App Action.
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default Page;
