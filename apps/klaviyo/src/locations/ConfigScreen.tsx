import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Form,
  Stack,
  Text,
  Popover,
  Pill,
  Tooltip,
} from '@contentful/f36-components';
import { ChevronDownIcon } from '@contentful/f36-icons';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

import { KlaviyoAppConfig } from '../config/klaviyo';
import { getContentTypes } from '../utils/contentful-helper';
import {
  getEntryKlaviyoFieldMappings,
  setEntryKlaviyoFieldMappings,
} from '../utils/field-mappings';
import { APPS_ORGANIZATION_ID } from '../constants';

// Helper to ensure klaviyoFieldMappings entry exists
const ensureKlaviyoFieldMappingsEntry = async (sdk: ConfigAppSDK) => {
  const cma = sdk.cma;
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environment;
  // Try to find the entry by content type
  const entries = await cma.entry.getMany({
    spaceId,
    environmentId,
    content_type: 'klaviyoFieldMappings',
    limit: 1,
  } as any);
  if (entries.items && entries.items.length > 0) {
    return entries.items[0];
  }
  // If not found, create it
  const defaultLocale = sdk.locales?.default || 'en-US';
  const entry = await cma.entry.create(
    { spaceId, environmentId, contentTypeId: 'klaviyoFieldMappings' } as any,
    {
      fields: {
        mappings: {
          [defaultLocale]: JSON.stringify([]),
        },
      },
    }
  );
  // Optionally publish the entry
  await cma.entry.publish({ entryId: entry.sys.id, spaceId, environmentId }, entry);
  return entry;
};

// Build editor interface config based on selected locations and content types
const buildEditorInterfaceConfig = (selectedContentTypes: Record<string, boolean>) => {
  const targetContentTypes = Object.keys(selectedContentTypes).filter(
    (contentTypeId) => selectedContentTypes[contentTypeId]
  );

  // Build target state for editor interface
  const editorInterface: Record<string, any> = {};

  // Always enable entry-sidebar
  targetContentTypes.forEach((contentTypeId) => {
    editorInterface[contentTypeId] = {
      sidebar: {
        position: 0,
      },
    };
  });

  return editorInterface;
};

const onConfigure = async (sdk: ConfigAppSDK, selectedContentTypes: Record<string, boolean>) => {
  const currentParameters = await sdk.app.getParameters();
  const localMappings = await getEntryKlaviyoFieldMappings(sdk, '');
  const contentTypeMappings = currentParameters?.contentTypeMappings || {};
  if (localMappings.length > 0) {
    const mappingsByContentType: Record<string, any[]> = {};
    localMappings.forEach((mapping) => {
      if (mapping.contentTypeId) {
        if (!mappingsByContentType[mapping.contentTypeId]) {
          mappingsByContentType[mapping.contentTypeId] = [];
        }
        mappingsByContentType[mapping.contentTypeId].push(mapping);
      }
    });
    Object.keys(mappingsByContentType).forEach((contentTypeId) => {
      contentTypeMappings[contentTypeId] = mappingsByContentType[contentTypeId];
    });
  }
  let allMappings: any[] = [];
  Object.keys(contentTypeMappings).forEach((typeId) => {
    const typeMappings = contentTypeMappings[typeId];
    if (Array.isArray(typeMappings)) {
      allMappings = [...allMappings, ...typeMappings];
    }
  });
  const spaceId = sdk.ids.space;
  const selectedLocations = { 'entry-sidebar': true };
  const parameters = {
    selectedLocations,
    selectedContentTypes,
    spaceId,
    fieldMappings: allMappings,
    contentTypeMappings,
  };
  const filteredSelectedContentTypes = Object.keys(selectedContentTypes)
    .filter((id) => selectedContentTypes[id])
    .reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {} as Record<string, boolean>);
  const editorInterface = buildEditorInterfaceConfig(filteredSelectedContentTypes);
  await ensureKlaviyoFieldMappingsEntry(sdk);
  return {
    parameters,
    targetState: {
      EditorInterface: editorInterface,
    },
  };
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [selectedContentTypes, setSelectedContentTypes] = useState<Record<string, boolean>>({});
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [isHoveringConnected, setIsHoveringConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const popupWindowRef = useRef<Window | null>(null);
  const checkWindowIntervalRef = useRef<number | null>(null);

  // Check Klaviyo connection status with polling to handle race conditions
  const checkKlaviyoStatus = async (
    expectedStatus?: boolean,
    maxRetries: number = 10
  ): Promise<void> => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Checking Klaviyo connection status (attempt ${attempt}/${maxRetries})...`);
        const appActions = await sdk.cma.appAction.getMany({
          organizationId: APPS_ORGANIZATION_ID,
          appDefinitionId: sdk.ids.app,
        });

        const checkStatusAppAction = appActions.items.find(
          (action) => action.name === 'Check Status'
        );
        if (!checkStatusAppAction) {
          console.warn('Check Status app action not found');
          setIsCheckingStatus(false);
          return;
        }

        const response = await sdk.cma.appActionCall.createWithResponse(
          {
            appActionId: checkStatusAppAction.sys.id,
            appDefinitionId: sdk.ids.app,
          },
          {
            parameters: {},
          }
        );

        const statusData = JSON.parse(response.response.body);
        console.log(`Klaviyo status response (attempt ${attempt}):`, statusData);

        // Assuming the response contains a connected field
        const isConnected = statusData.connected === true;
        console.log(`Klaviyo connection status (attempt ${attempt}):`, isConnected);

        // If we have an expected status and it matches, or if we don't have an expected status, accept the result
        if (expectedStatus === undefined || isConnected === expectedStatus) {
          setIsOAuthConnected(isConnected);
          console.log(`Status check resolved to expected value: ${isConnected}`);
          break;
        } else {
          console.log(
            `Status mismatch. Expected: ${expectedStatus}, Got: ${isConnected}. Retrying...`
          );

          // If this is the last attempt, accept the current result anyway
          if (attempt === maxRetries) {
            console.log(`Max retries reached. Accepting current status: ${isConnected}`);
            setIsOAuthConnected(isConnected);
            break;
          }

          // Wait before retrying (exponential backoff: 500ms, 1000ms, 1500ms, etc.)
          const waitTime = 500 * attempt;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
        }
      } catch (error) {
        console.error(`Failed to check Klaviyo status (attempt ${attempt}):`, error);

        // If this is the last attempt, set status to false and give up
        if (attempt === maxRetries) {
          console.log('Max retries reached. Setting status to false due to errors.');
          setIsOAuthConnected(false);
          break;
        }

        // Wait before retrying on error
        const waitTime = 500 * attempt;
        console.log(`Waiting ${waitTime}ms before retry after error...`);
        await delay(waitTime);
      }
    }

    setIsCheckingStatus(false);
    console.log(`Status check polling completed. Final status: ${isOAuthConnected}`);
  };

  const messageHandler = async (event: MessageEvent) => {
    if (event.data.type === 'oauth:complete') {
      console.log('oauth:complete');
      const appDefinitionId = sdk.ids.app;
      // call app action to complete oauth
      const appActions = await sdk.cma.appAction.getMany({
        organizationId: sdk.ids.organization,
        appDefinitionId,
      });
      console.log('appActions', appActions);
      const completeOauthAppAction = appActions.items.find(
        (action) => action.name === 'Complete Oauth'
      );
      await sdk.cma.appActionCall.create(
        { appDefinitionId, appActionId: completeOauthAppAction?.sys.id || '' },
        {
          parameters: {
            code: event.data.code,
            state: event.data.state,
          },
        }
      );
      console.log('completeOauthAppAction', completeOauthAppAction);
      // Check the updated status after OAuth completion - expect it to be connected
      await checkKlaviyoStatus(true);

      sdk.notifier.success('OAuth complete');
      cleanup();
      setIsOAuthLoading(false);
    }
  };

  const cleanup = () => {
    console.log('cleanup called');
    // Clear the interval
    if (checkWindowIntervalRef.current) {
      window.clearInterval(checkWindowIntervalRef.current);
      checkWindowIntervalRef.current = null;
    }
    // Remove the message event listener
    console.log('Removing message event listener');
    window.removeEventListener('message', messageHandler);
    console.log('Message event listener removed');
    // Close the popup if it's still open
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.close();
    }
    popupWindowRef.current = null;
  };

  const handleOAuth = async () => {
    console.log('handleOAuth started');
    setIsOAuthLoading(true);

    window.removeEventListener('message', messageHandler);
    window.addEventListener('message', messageHandler);

    try {
      const appActions = await sdk.cma.appAction.getMany({
        organizationId: APPS_ORGANIZATION_ID,
        appDefinitionId: sdk.ids.app,
      });

      const initiateOauthAppAction = appActions.items.find(
        (action) => action.name === 'Initiate Oauth'
      );

      const response = await sdk.cma.appActionCall.createWithResponse(
        {
          appActionId: initiateOauthAppAction?.sys.id || '',
          appDefinitionId: sdk.ids.app,
        },
        {
          parameters: {},
        }
      );

      const authorizationUrl = JSON.parse(response.response.body).authorizationUrl;

      popupWindowRef.current = window.open(authorizationUrl, '_blank', 'height=700,width=450');

      // Check if the window was closed
      // checkWindowIntervalRef.current = window.setInterval(() => {
      //   if (popupWindowRef.current?.closed) {
      //     cleanup();
      //     setIsOAuthLoading(false);
      //   }
      // }, 1000);
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
      cleanup();
      setIsOAuthLoading(false);
      sdk.notifier.error('Failed to initiate OAuth flow');
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const appActions = await sdk.cma.appAction.getMany({
        organizationId: sdk.ids.organization,
        appDefinitionId: sdk.ids.app,
      });
      const disconnectAppAction = appActions.items.find((action) => action.name === 'Disconnect');
      await sdk.cma.appActionCall.create(
        {
          appActionId: disconnectAppAction?.sys.id || '',
          appDefinitionId: sdk.ids.app,
        },
        { parameters: {} }
      );

      // Check the updated status after disconnection - expect it to be disconnected
      await checkKlaviyoStatus(false);

      setIsHoveringConnected(false);
      sdk.notifier.success('Disconnected from Klaviyo');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      sdk.notifier.error('Failed to disconnect from Klaviyo');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getButtonText = () => {
    if (isDisconnecting) return 'Disconnecting...';
    if (isCheckingStatus) return 'Checking...';
    if (isOAuthLoading) return 'Connecting...';
    if (isOAuthConnected && isHoveringConnected) return 'Disconnect';
    if (isOAuthConnected) return 'Connected';
    return 'Connect';
  };

  const getButtonVariant = () => {
    if (isCheckingStatus) return 'secondary';
    if (isOAuthConnected && !isHoveringConnected) return 'positive';
    if (isOAuthConnected && isHoveringConnected) return 'negative';
    return 'primary';
  };

  const handleButtonClick = () => {
    if (isCheckingStatus) return; // Don't allow clicks while checking status
    if (isOAuthConnected && isHoveringConnected) {
      handleDisconnect();
    } else if (!isOAuthConnected && !isOAuthLoading) {
      handleOAuth();
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      const parameters = await sdk.app.getParameters<KlaviyoAppConfig>();
      if (parameters) {
        setSelectedContentTypes(parameters.selectedContentTypes || {});
        if (parameters.fieldMappings || parameters.contentTypeMappings) {
          if (parameters.fieldMappings && Array.isArray(parameters.fieldMappings)) {
            setEntryKlaviyoFieldMappings(sdk, '', parameters.fieldMappings);
          }
        }
      }
      const isInstalled = await sdk.app.isInstalled();
      setIsReadOnly(isInstalled);
      loadContentTypes();

      // Check Klaviyo connection status
      if (isInstalled) {
        await checkKlaviyoStatus();
      }

      sdk.app.setReady();
    };
    initializeApp();
  }, [sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure(sdk, selectedContentTypes));
  }, [sdk, selectedContentTypes]);

  // Load content types
  const loadContentTypes = async () => {
    try {
      const types = await getContentTypes(sdk.cma);
      setContentTypes(types);
    } catch (error) {
      console.error('Error loading content types:', error);
      sdk.notifier.error('Failed to load content types');
    }
  };

  // Helper to get content type name by ID
  const getContentTypeName = (id: string) => {
    const ct = contentTypes.find((ct) => ct.sys.id === id);
    return ct ? ct.name : id;
  };

  // Handle select all
  const allSelected =
    contentTypes.length > 0 &&
    Object.keys(selectedContentTypes).filter((id) => selectedContentTypes[id]).length ===
      contentTypes.length;
  const handleSelectAll = () => {
    if (allSelected) {
      const cleared: Record<string, boolean> = {};
      contentTypes.forEach((ct) => {
        cleared[ct.sys.id] = false;
      });
      setSelectedContentTypes(cleared);
    } else {
      const all: Record<string, boolean> = {};
      contentTypes.forEach((ct) => {
        all[ct.sys.id] = true;
      });
      setSelectedContentTypes(all);
    }
  };

  // Handle pill remove
  const handleRemoveContentType = (id: string) => {
    setSelectedContentTypes((prev) => ({ ...prev, [id]: false }));
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return (
    <Box style={{ maxWidth: '800px', margin: '64px auto' }}>
      <Box padding="spacingXl" style={{ border: '1px solid #E5EBED', borderRadius: '4px' }}>
        {/* Title and Subtitle */}
        <Stack
          spacing="spacingS"
          flexDirection="column"
          alignItems="flex-start"
          style={{ marginBottom: '32px' }}>
          <Text fontSize="fontSizeXl" fontWeight="fontWeightMedium">
            Set up Klaviyo
          </Text>
          <Text fontColor="gray500">
            Seamlessly sync content from Contentful to Klaviyo, the only CRM built for B2C
          </Text>
        </Stack>

        {/* OAuth Connection Component Placeholder */}
        <Box style={{ marginBottom: '32px', width: '100%' }}>
          <Tooltip
            content="App must be installed to connect"
            isDisabled={isReadOnly}
            placement="top">
            <Button
              variant={getButtonVariant()}
              onClick={handleButtonClick}
              onMouseEnter={() => {
                if (isOAuthConnected) {
                  setIsHoveringConnected(true);
                }
              }}
              onMouseLeave={() => {
                setIsHoveringConnected(false);
              }}
              isLoading={isOAuthLoading}
              isDisabled={isOAuthLoading || isDisconnecting || isCheckingStatus || !isReadOnly}>
              {getButtonText()}
            </Button>
          </Tooltip>
        </Box>
        {/* End OAuth Connection Component Placeholder */}
        <Stack spacing="spacingXl" flexDirection="column" alignItems="flex-start">
          <Form style={{ width: '100%' }}>
            <Stack spacing="spacingXl" flexDirection="column" alignItems="flex-start">
              {/* Content Types Dropdown Section */}
              <Stack
                spacing="spacingM"
                flexDirection="column"
                alignItems="flex-start"
                style={{ width: '100%' }}>
                <Text fontWeight="fontWeightMedium">Content Types</Text>
                <Text fontColor="gray500">
                  Select which content types to enable with the Klaviyo integration
                </Text>
                <Box style={{ width: '100%', position: 'relative' }}>
                  <Popover
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    placement="bottom-start">
                    <Popover.Trigger>
                      <Button
                        variant="secondary"
                        endIcon={<ChevronDownIcon />}
                        style={{ width: '100%', justifyContent: 'space-between' }}
                        onClick={() => setIsDropdownOpen((open) => !open)}
                        aria-haspopup="listbox"
                        aria-expanded={isDropdownOpen}>
                        {Object.keys(selectedContentTypes).filter((id) => selectedContentTypes[id])
                          .length > 0
                          ? `${
                              Object.keys(selectedContentTypes).filter(
                                (id) => selectedContentTypes[id]
                              ).length
                            } selected`
                          : 'Select content types'}
                      </Button>
                    </Popover.Trigger>
                    <Popover.Content>
                      <Box style={{ minWidth: 280, maxHeight: 320, overflowY: 'auto', padding: 8 }}>
                        <Checkbox
                          isChecked={allSelected}
                          onChange={handleSelectAll}
                          style={{ marginBottom: 8 }}>
                          Select all
                        </Checkbox>
                        <Stack flexDirection="column" alignItems="flex-start" spacing="none">
                          {contentTypes.map((ct) => (
                            <Checkbox
                              key={ct.sys.id}
                              isChecked={!!selectedContentTypes[ct.sys.id]}
                              onChange={() =>
                                setSelectedContentTypes((prev) => ({
                                  ...prev,
                                  [ct.sys.id]: !prev[ct.sys.id],
                                }))
                              }
                              style={{ marginBottom: 4 }}>
                              {ct.name}
                            </Checkbox>
                          ))}
                        </Stack>
                      </Box>
                    </Popover.Content>
                  </Popover>
                </Box>
                {/* Pills for selected content types */}
                <Flex flexWrap="wrap" gap="spacingXs" style={{ marginTop: 12 }}>
                  {Object.keys(selectedContentTypes)
                    .filter((id) => selectedContentTypes[id])
                    .map((id) => (
                      <Pill
                        key={id}
                        label={getContentTypeName(id)}
                        onClose={() => handleRemoveContentType(id)}
                        style={{ marginBottom: 6 }}
                      />
                    ))}
                </Flex>
              </Stack>
            </Stack>
          </Form>
        </Stack>
      </Box>
    </Box>
  );
};

export default ConfigScreen;
