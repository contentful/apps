import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Note,
  Paragraph,
  Spinner,
  Text,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { ContentTypePickerModal, SelectedContentType } from './ContentTypePickerModal';
import { getAppActionId } from '../../utils/getAppActionId';

interface ContentTypeSelectorProps {
  sdk: PageAppSDK;
  isDisabled?: boolean;
}

export const ContentTypeSelector = ({ sdk, isDisabled }: ContentTypeSelectorProps) => {
  const [isContentTypePickerOpen, setIsContentTypePickerOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleContentTypeSelected = async (contentTypes: SelectedContentType[]) => {
    const names = contentTypes.map((ct) => ct.name).join(', ');
    sdk.notifier.success(
      `Selected ${contentTypes.length} content type${contentTypes.length > 1 ? 's' : ''}: ${names}`
    );
    setIsContentTypePickerOpen(false);

    await analyzeContentTypes(contentTypes.map((ct) => ct.id));
  };

  const analyzeContentTypes = async (contentTypeIds: string[]) => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      setAnalysisResult(null);

      const appDefinitionId = sdk.ids.app;

      if (!appDefinitionId) {
        throw new Error('App definition ID not found');
      }

      const appActionId = await getAppActionId(sdk, 'createEntriesFromDocumentAction');

      const result = await sdk.cma.appActionCall.createWithResult(
        {
          appDefinitionId,
          appActionId,
        },
        {
          parameters: { contentTypeIds },
        }
      );

      if ('errors' in result && result.errors) {
        throw new Error(JSON.stringify(result.errors));
      }

      setAnalysisResult(result.sys);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze content types');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Flex marginTop="spacingM">
        <Button
          variant="primary"
          onClick={() => {
            setIsContentTypePickerOpen(true);
          }}
          isDisabled={isDisabled || isAnalyzing}>
          Select Content Type
        </Button>
      </Flex>

      {isAnalyzing && (
        <Box marginTop="spacingM">
          <Flex alignItems="center" gap="spacingS">
            <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
              Analyzing content types
            </Text>
            <Spinner />
          </Flex>
        </Box>
      )}

      {analysisError && (
        <Box marginTop="spacingM">
          <Note variant="negative">Error: {analysisError}</Note>
        </Box>
      )}

      {analysisResult && (
        <Box marginTop="spacingL" style={{ border: '1px solid #e5e5e5', padding: '16px' }}>
          <Heading as="h3" marginBottom="spacingS">
            Analysis Result
          </Heading>
          <Paragraph marginBottom="spacingS">
            Raw output from the content type analysis agent:
          </Paragraph>
          <Box
            style={{
              maxHeight: '400px',
              overflow: 'auto',
              background: '#f7f9fa',
              padding: '16px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
            {JSON.stringify(analysisResult.result.response, null, 2)}
          </Box>
        </Box>
      )}

      <ContentTypePickerModal
        sdk={sdk}
        isOpen={isContentTypePickerOpen}
        onClose={() => {
          setIsContentTypePickerOpen(false);
        }}
        onSelect={handleContentTypeSelected}
      />
    </>
  );
};
