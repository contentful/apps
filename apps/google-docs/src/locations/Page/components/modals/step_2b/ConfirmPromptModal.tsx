import { useEffect } from 'react';
import {
  Button,
  CopyButton,
  Modal,
  Box,
  Text,
  TextLink,
  Spinner,
  Note,
  Flex,
  Pill,
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
            <Box marginBottom="spacingXs">
              <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
                <Text fontWeight="fontWeightDemiBold" as="p">
                  Document ID
                </Text>
                <CopyButton value={documentId} label="Copy document id" isDisabled={!documentId} />
              </Flex>
              <Box
                className={css({
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  backgroundColor: '#f7f9fa',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                })}>
                <Text fontColor="gray700">{documentId}</Text>
              </Box>
            </Box>

            <Box marginBottom="spacingXs">
              <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
                <Text fontWeight="fontWeightDemiBold" as="p">
                  Selected Content Type IDs
                </Text>
              </Flex>
              {contentTypeIds.length > 0 ? (
                <Flex flexWrap="wrap" className={css({ gap: '6px' })}>
                  {contentTypeIds.map((id) => (
                    <Pill key={id} label={id} />
                  ))}
                </Flex>
              ) : (
                <Text fontColor="gray600">No content types selected</Text>
              )}
            </Box>

            <Box marginBottom="spacingXs">
              <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
                <Text fontWeight="fontWeightDemiBold" as="p">
                  OAuth token
                </Text>
                <CopyButton value={oauthToken} label="Copy OAuth token" isDisabled={!oauthToken} />
              </Flex>
              <Box
                className={css({
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  backgroundColor: '#f7f9fa',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  wordBreak: 'break-all',
                })}>
                <Text fontColor="gray700">{oauthToken}</Text>
              </Box>
            </Box>

            <Box marginBottom="spacingXs">
              <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingXs">
                <Text fontWeight="fontWeightDemiBold" as="p">
                  Analysis Result
                </Text>
                <Flex
                  alignItems="center"
                  className={css({
                    gap: '8px',
                  })}>
                  <TextLink
                    href="http://localhost:4111/workflows/googleDocsWorkflow/graph"
                    target="_blank"
                    rel="noreferrer"
                    className={css({ fontSize: '12px' })}>
                    View workflow in Mastra playground
                  </TextLink>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleAnalyze}
                    isLoading={isAnalyzing}
                    isDisabled={isAnalyzing}>
                    Start workflow
                  </Button>
                </Flex>
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
                <Box
                  className={css({
                    padding: '8px 10px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    backgroundColor: '#f7f9fa',
                    whiteSpace: 'pre-wrap',
                    borderRadius: '4px',
                    maxHeight: '260px',
                    overflow: 'auto',
                  })}>
                  <Text as="pre" marginBottom="none">
                    {analysisResult}
                  </Text>
                </Box>
              )}
              {!analysisResult && !isAnalyzing && !error && (
                <Box
                  className={css({
                    padding: '8px 10px',
                    backgroundColor: '#f7f9fa',
                    borderRadius: '4px',
                    textAlign: 'center',
                  })}>
                  <Text fontColor="gray600">
                    Click "Start workflow" to preview the document analysis
                  </Text>
                </Box>
              )}
            </Box>
          </Modal.Content>
          {/* <Modal.Controls>
            <Button onClick={handleClose} variant="secondary" isDisabled={isAnalyzing}>
              Back
            </Button>
            <Button onClick={handleConfirm} variant="primary" isDisabled={isAnalyzing}>
              Generate Preview
            </Button>
          </Modal.Controls> */}
        </>
      )}
    </Modal>
  );
};
