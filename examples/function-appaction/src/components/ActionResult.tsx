import { PageAppSDK } from '@contentful/app-sdk';
import { Accordion, Flex, IconButton, Stack, Text } from '@contentful/f36-components';
import { CopyIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import { ActionResultType } from '../locations/Page';

interface Props {
  actionResult: ActionResultType;
}

const ActionResult = (props: Props) => {
  const [accordionState, setAccordionState] = useState<any>({});
  const sdk = useSDK<PageAppSDK>();

  const { actionResult } = props;
  const { success, data, error, timestamp, actionId } = actionResult;
  const errorMessage = error instanceof Error ? JSON.parse(error.message) : undefined;
  const statusCode = success ? data?.response?.statusCode : errorMessage?.status || 500;
  const successColor = success ? tokens.colorPositive : tokens.colorNegative;
  const duration =
    data && new Date(data.responseAt).getMilliseconds() - new Date(timestamp).getMilliseconds();

  const handleExpand = (itemKey: string) => () =>
    setAccordionState((prevState: any) => ({ ...prevState, [itemKey]: true }));

  const handleCollapse = (itemKey: string) => () =>
    setAccordionState((prevState: any) => ({ ...prevState, [itemKey]: false }));

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

  return (
    <Accordion key={`${actionId}-${timestamp}`} style={{ marginTop: '20px' }}>
      <Accordion.Item
        title={
          <Text style={{ textAlign: 'left' }}>
            <span style={{ color: successColor, fontWeight: 'bold' }}>
              {success ? 'Success' : 'Failed'} [{statusCode}]
            </span>{' '}
            - {timestamp}
            {'function' in (data?.request || {}) && (
              <Text style={{ marginLeft: '4px' }}>
                (Function: <strong>{data?.request?.function}</strong>)
              </Text>
            )}
            {typeof duration === 'number' && (
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
                    <code>{JSON.stringify(JSON.parse(data?.request?.body || ''), null, 2)}</code>
                  </pre>
                  <IconButton
                    variant="transparent"
                    icon={<CopyIcon />}
                    aria-label="Copy request body"
                    onClick={() => handleCopy(data?.response?.body || '', 'request body')}
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
            title={<Text style={{ textAlign: 'left', fontWeight: 'bold' }}>Response Details</Text>}
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
                    <code>{JSON.stringify(JSON.parse(data?.response?.body || ''), null, 2)}</code>
                  </pre>
                  <IconButton
                    variant="transparent"
                    icon={<CopyIcon />}
                    aria-label="Copy response body"
                    onClick={() => handleCopy(data?.response?.body || '', 'response body')}
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
                {data?.responseAt && (
                  <>
                    <strong>Response At:</strong> {new Date(data.responseAt).toLocaleString()}
                  </>
                )}
              </Text>
            </Stack>
          </Accordion.Item>
        </Accordion>
      </Accordion.Item>
    </Accordion>
  );
};

export default ActionResult;
