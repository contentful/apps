import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Form,
  FormControl,
  Modal,
  Stack,
  Text,
  Card,
  Note,
  Spinner,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { TEST_DOCUMENTS } from '../../utils/test_docs_json';
import {
  listGoogleDocsAction,
  fetchGoogleDocAction,
  GoogleDoc,
} from '../../utils/appFunctionUtils';
import { OAuthConnector } from './OAuthConnector';

interface GoogleDocUploaderProps {
  sdk: PageAppSDK;
  onSuccess: (title: string, html: string | null) => void;
  onError: (message: string) => void;
  isDisabled?: boolean;
}

export const GoogleDocUploader = ({
  sdk,
  onSuccess,
  onError,
  isDisabled,
}: GoogleDocUploaderProps) => {
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isOAuthConnected, setIsOAuthConnected] = useState<boolean>(false);
  const [isCheckingOAuth, setIsCheckingOAuth] = useState<boolean>(true);
  const [googleDocs, setGoogleDocs] = useState<GoogleDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [showTestDocs, setShowTestDocs] = useState<boolean>(false);

  // Check OAuth status on mount
  useEffect(() => {
    checkOAuthStatus();
  }, []);

  // Fetch Google Docs when OAuth is connected
  useEffect(() => {
    if (isOAuthConnected && !isCheckingOAuth) {
      fetchGoogleDocs();
    }
  }, [isOAuthConnected, isCheckingOAuth]);

  const checkOAuthStatus = async () => {
    try {
      setIsCheckingOAuth(true);
      const appActions = await sdk.cma.appAction.getManyForEnvironment({
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      });

      const checkStatusAppAction = appActions.items.find(
        (action) => action.name === 'checkGdocOauthTokenStatus'
      );
      if (!checkStatusAppAction) {
        setIsOAuthConnected(false);
        setIsCheckingOAuth(false);
        return;
      }

      const appDefinitionId = sdk.ids.app;
      if (!appDefinitionId) {
        setIsOAuthConnected(false);
        setIsCheckingOAuth(false);
        return;
      }

      const response = await sdk.cma.appActionCall.createWithResponse(
        {
          appActionId: checkStatusAppAction.sys.id,
          appDefinitionId,
        },
        {
          parameters: {},
        }
      );

      const statusData = JSON.parse(response.response.body);
      setIsOAuthConnected(statusData.connected === true);
    } catch (error) {
      console.error('Failed to check OAuth status:', error);
      setIsOAuthConnected(false);
    } finally {
      setIsCheckingOAuth(false);
    }
  };

  const fetchGoogleDocs = async () => {
    try {
      setIsLoadingDocs(true);

      // First, verify the app action exists
      const appActions = await sdk.cma.appAction.getManyForEnvironment({
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      });

      const listDocsAction = appActions.items.find((action) => action.name === 'listGoogleDocs');
      if (!listDocsAction) {
        const availableActions = appActions.items.map((a) => a.name).join(', ');
        const errorMsg = `App action "listGoogleDocs" not found. Available actions: ${
          availableActions || 'none'
        }. Please rebuild and redeploy the app.`;
        console.error(errorMsg);
        sdk.notifier.error(errorMsg);
        return;
      }

      const result = await listGoogleDocsAction(sdk);
      setGoogleDocs(result.documents || []);
    } catch (error) {
      console.error('Failed to fetch Google Docs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Google Docs';
      sdk.notifier.error(errorMessage);

      // If it's a NotFound error, provide more helpful guidance
      if (errorMessage.includes('not found') || errorMessage.includes('NotFound')) {
        sdk.notifier.error(
          'The app actions are not available. Please ensure you have run: npm run build:functions && npm run build && npm run upload-dev'
        );
      }
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleSelectDocument = async (docId: string, title: string, documentData: any) => {
    setSelectedDocument(title);
    setIsModalOpen(false);

    try {
      setIsUploading(true);

      // Log the document data to console
      console.log('Selected document:', title);
      console.log('Document data:', documentData);

      sdk.notifier.success(`Document "${title}" loaded successfully`);

      // Proceed to content type selector with the document data
      onSuccess(title, JSON.stringify(documentData));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load document.';
      onError(message);
      sdk.notifier.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectGoogleDoc = async (doc: GoogleDoc) => {
    setSelectedDocument(doc.name);
    setIsModalOpen(false);

    try {
      setIsUploading(true);

      // First, verify the app action exists
      const appActions = await sdk.cma.appAction.getManyForEnvironment({
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      });

      const fetchDocAction = appActions.items.find((action) => action.name === 'fetchGoogleDoc');
      if (!fetchDocAction) {
        const availableActions = appActions.items.map((a) => a.name).join(', ');
        const errorMsg = `App action "fetchGoogleDoc" not found. Available actions: ${
          availableActions || 'none'
        }. Please rebuild and redeploy the app.`;
        console.error(errorMsg);
        sdk.notifier.error(errorMsg);
        onError(errorMsg);
        return;
      }

      // Fetch the full document JSON
      const documentData = await fetchGoogleDocAction(sdk, doc.id);

      sdk.notifier.success(`Document "${doc.name}" loaded successfully`);

      // Proceed to content type selector with the document data
      onSuccess(doc.name, JSON.stringify(documentData));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load document.';
      onError(message);
      sdk.notifier.error(message);

      // If it's a NotFound error, provide more helpful guidance
      if (message.includes('not found') || message.includes('NotFound')) {
        sdk.notifier.error(
          'The app actions are not available. Please ensure you have run: npm run build:functions && npm run build && npm run upload-dev'
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form>
      <FormControl>
        <Box marginBottom="spacingM">
          <OAuthConnector
            onOAuthConnectedChange={(connected) => {
              setIsOAuthConnected(connected);
              if (connected) {
                fetchGoogleDocs();
              }
            }}
            isOAuthConnected={isOAuthConnected}
          />
        </Box>

        <Button
          variant="secondary"
          onClick={() => setIsModalOpen(true)}
          isDisabled={isDisabled || isUploading || isCheckingOAuth}>
          {selectedDocument ? 'Change Document' : 'Select Document'}
        </Button>

        {selectedDocument && (
          <Box marginTop="spacingS">
            <Text fontWeight="fontWeightDemiBold">Selected: {selectedDocument}</Text>
          </Box>
        )}

        {isUploading && (
          <Box marginTop="spacingS">
            <Text fontColor="gray500" fontSize="fontSizeS">
              Processing document...
            </Text>
          </Box>
        )}

        <FormControl.HelpText>
          {isOAuthConnected
            ? 'Select a Google Doc from your Drive or use a test document'
            : 'Connect to Google Drive to access your documents, or use test documents'}
        </FormControl.HelpText>
      </FormControl>

      <Modal onClose={() => setIsModalOpen(false)} isShown={isModalOpen} size="large">
        {() => (
          <>
            <Modal.Header
              title={isOAuthConnected ? 'Select a Document' : 'Select a Test Document'}
              onClose={() => setIsModalOpen(false)}
            />
            <Modal.Content>
              <Stack flexDirection="column" spacing="spacingM">
                {isOAuthConnected && (
                  <>
                    <Box>
                      <Text fontWeight="fontWeightDemiBold" marginBottom="spacingS">
                        Your Google Docs
                      </Text>
                      {isLoadingDocs ? (
                        <Box padding="spacingL" textAlign="center">
                          <Spinner />
                          <Text marginTop="spacingS" fontColor="gray500">
                            Loading your documents...
                          </Text>
                        </Box>
                      ) : googleDocs.length === 0 ? (
                        <Note variant="warning">
                          No Google Docs found. Make sure you have documents in your Google Drive.
                        </Note>
                      ) : (
                        <Stack flexDirection="column" spacing="spacingS">
                          {googleDocs.map((doc) => (
                            <Card
                              key={doc.id}
                              as="button"
                              onClick={() => handleSelectGoogleDoc(doc)}
                              style={{ cursor: 'pointer', textAlign: 'left', padding: '12px' }}>
                              <Stack flexDirection="column" spacing="spacingXs">
                                <Text fontWeight="fontWeightDemiBold">{doc.name}</Text>
                                <Text fontSize="fontSizeS" fontColor="gray500">
                                  Modified: {new Date(doc.modifiedTime).toLocaleDateString()}
                                </Text>
                              </Stack>
                            </Card>
                          ))}
                        </Stack>
                      )}
                    </Box>

                    <Box>
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => setShowTestDocs(!showTestDocs)}>
                        {showTestDocs ? 'Hide' : 'Show'} Test Documents
                      </Button>
                    </Box>
                  </>
                )}

                {(showTestDocs || !isOAuthConnected) && (
                  <Box>
                    <Text fontWeight="fontWeightDemiBold" marginBottom="spacingS">
                      {isOAuthConnected ? 'Test Documents' : 'Available Test Documents'}
                    </Text>
                    {!isOAuthConnected && (
                      <Box marginBottom="spacingS">
                        <Note variant="warning">
                          Connect to Google Drive to access your real documents
                        </Note>
                      </Box>
                    )}
                    <Stack flexDirection="column" spacing="spacingS">
                      {TEST_DOCUMENTS.filter((doc) => doc.data).map((doc, index) => (
                        <Card
                          key={index}
                          as="button"
                          onClick={() => handleSelectDocument(doc.id, doc.title, doc.data)}
                          style={{ cursor: 'pointer', textAlign: 'left', padding: '12px' }}>
                          <Stack flexDirection="column" spacing="spacingXs">
                            <Text fontWeight="fontWeightDemiBold">{doc.title}</Text>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Modal.Content>
          </>
        )}
      </Modal>
    </Form>
  );
};
