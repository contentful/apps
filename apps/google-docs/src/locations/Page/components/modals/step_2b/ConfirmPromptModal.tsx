import { useEffect } from 'react';
import {
  Button,
  Modal,
  Paragraph,
  Box,
  Text,
  Textarea,
  Spinner,
  Note,
  Flex,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { css } from '@emotion/css';
import { useAnalyzePrompt } from '../../../../../hooks/useAnalyzePrompt';

interface ConfirmPromptModalProps {
  sdk: PageAppSDK;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentId: string;
  selectedContentTypes: ContentTypeProps[];
  oauthToken: string;
}

const buildPromptText = (
  documentId: string,
  contentTypeIds: string[],
  oauthToken: string
): string => {
  return `Analyze the following google docs document ${documentId} and extract the Contentful entries and assets for the following content types: ${contentTypeIds.join(
    ', '
  )} with the following oauth token: ${oauthToken}`;
};

export const ConfirmPromptModal = ({
  sdk,
  isOpen,
  onClose,
  onConfirm,
  documentId,
  selectedContentTypes,
  oauthToken,
}: ConfirmPromptModalProps) => {
  const contentTypeIds = selectedContentTypes.map((ct) => ct.sys.id);
  const promptText = buildPromptText(documentId, contentTypeIds, oauthToken);

  const { isAnalyzing, analysisResult, error, analyze, clearAnalysis } = useAnalyzePrompt({
    sdk,
    documentId,
    oauthToken,
  });

  useEffect(() => {
    if (!isOpen) {
      clearAnalysis();
    }
  }, [isOpen, clearAnalysis]);

  const handleClose = () => {
    if (isAnalyzing) return;
    onClose();
  };

  const handleAnalyze = () => {
    analyze(contentTypeIds);
  };

  const handleConfirm = () => {
    if (analysisResult) {
      console.log('[ConfirmPromptModal] Analysis result before proceeding:', analysisResult);
    }
    onConfirm();
  };

  return (
    <Modal isShown={isOpen} onClose={handleClose} size="large">
      {() => (
        <>
          <Modal.Header title="Confirm prompt" />
          <Modal.Content className={css({ minHeight: '400px' })}>
            <Paragraph marginBottom="spacingM" color="gray700">
              Review the prompt and optionally analyze the document before generating the preview.
            </Paragraph>

            <Box marginBottom="spacingM">
              <Text fontWeight="fontWeightDemiBold" marginBottom="spacingXs" as="p">
                Document ID
              </Text>
              <Text fontColor="gray700">{documentId}</Text>
            </Box>

            <Box marginBottom="spacingM">
              <Text fontWeight="fontWeightDemiBold" marginBottom="spacingXs" as="p">
                Selected Content Types
              </Text>
              <Text fontColor="gray700">
                {selectedContentTypes.map((ct) => ct.name).join(', ')}
              </Text>
            </Box>

            <Box marginBottom="spacingM">
              <Text fontWeight="fontWeightDemiBold" marginBottom="spacingXs" as="p">
                Prompt
              </Text>
              <Textarea
                value={promptText}
                isReadOnly
                rows={3}
                className={css({
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  backgroundColor: '#f7f9fa',
                })}
              />
            </Box>

            <Box marginBottom="spacingM">
              <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
                <Text fontWeight="fontWeightDemiBold" as="p">
                  Analysis Result
                </Text>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleAnalyze}
                  isLoading={isAnalyzing}
                  isDisabled={isAnalyzing}>
                  {analysisResult ? 'Re-analyze' : 'Analyze'}
                </Button>
              </Flex>
              {isAnalyzing && (
                <Box
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px',
                    backgroundColor: '#f7f9fa',
                    borderRadius: '4px',
                  })}>
                  <Spinner size="small" />
                  <Text fontColor="gray700">Analyzing document...</Text>
                </Box>
              )}
              {error && (
                <Note variant="negative" title="Analysis failed">
                  {error}
                </Note>
              )}
              {analysisResult && !isAnalyzing && (
                <Textarea
                  value={analysisResult}
                  isReadOnly
                  rows={10}
                  className={css({
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    backgroundColor: '#f7f9fa',
                    whiteSpace: 'pre-wrap',
                  })}
                />
              )}
              {!analysisResult && !isAnalyzing && !error && (
                <Box
                  className={css({
                    padding: '16px',
                    backgroundColor: '#f7f9fa',
                    borderRadius: '4px',
                    textAlign: 'center',
                  })}>
                  <Text fontColor="gray600">Click "Analyze" to preview the document analysis</Text>
                </Box>
              )}
            </Box>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={handleClose} variant="secondary" isDisabled={isAnalyzing}>
              Back
            </Button>
            <Button onClick={handleConfirm} variant="primary" isDisabled={isAnalyzing}>
              Generate Preview
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
