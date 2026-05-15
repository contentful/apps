import { useState } from 'react';
import { Button, Modal, Paragraph, TextLink } from '@contentful/f36-components';
import type { WorkflowDiagnosticInfo } from '@types';

export interface ErrorModalConfig {
  title: string;
  message: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  isPrimaryActionLoading?: boolean;
  diagnosticInfo?: WorkflowDiagnosticInfo;
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ErrorModalConfig;
}

const formatDiagnosticBlob = (info: WorkflowDiagnosticInfo): string => {
  const lines = [`Timestamp: ${info.timestamp}`];
  if (info.runId) lines.push(`Run ID: ${info.runId}`);
  if (info.workflowRunId) lines.push(`Workflow Run ID: ${info.workflowRunId}`);
  if (info.spaceId) lines.push(`Space ID: ${info.spaceId}`);
  if (info.environmentId) lines.push(`Environment ID: ${info.environmentId}`);
  return lines.join('\n');
};

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, config }) => {
  const {
    title,
    message,
    primaryActionLabel = 'Close',
    onPrimaryAction,
    secondaryActionLabel,
    onSecondaryAction,
    isPrimaryActionLoading = false,
    diagnosticInfo,
  } = config;
  const handlePrimaryAction = onPrimaryAction ?? onClose;
  const handleSecondaryAction = onSecondaryAction ?? onClose;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!diagnosticInfo) return;
    void navigator.clipboard.writeText(formatDiagnosticBlob(diagnosticInfo)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Modal
      isShown={isOpen}
      onClose={onClose}
      size="medium"
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}>
      {() => (
        <>
          <Modal.Header title={title} />
          <Modal.Content>
            <Paragraph>{message}</Paragraph>
            {diagnosticInfo && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#f7f9fa',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.6',
                }}>
                <Paragraph
                  marginBottom="spacingXs"
                  style={{ fontWeight: 600, fontSize: '12px', color: '#536171' }}>
                  Error details{' '}
                  <TextLink as="button" onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy'}
                  </TextLink>
                </Paragraph>
                {diagnosticInfo.runId && (
                  <div>
                    <span style={{ color: '#536171' }}>Run ID:</span> {diagnosticInfo.runId}
                  </div>
                )}
                {diagnosticInfo.workflowRunId && (
                  <div>
                    <span style={{ color: '#536171' }}>Workflow Run ID:</span>{' '}
                    {diagnosticInfo.workflowRunId}
                  </div>
                )}
                {diagnosticInfo.spaceId && (
                  <div>
                    <span style={{ color: '#536171' }}>Space ID:</span> {diagnosticInfo.spaceId}
                  </div>
                )}
                {diagnosticInfo.environmentId && (
                  <div>
                    <span style={{ color: '#536171' }}>Environment ID:</span>{' '}
                    {diagnosticInfo.environmentId}
                  </div>
                )}
                <div>
                  <span style={{ color: '#536171' }}>Timestamp:</span> {diagnosticInfo.timestamp}
                </div>
              </div>
            )}
          </Modal.Content>
          <Modal.Controls>
            <>
              {secondaryActionLabel ? (
                <Button onClick={handleSecondaryAction} variant="secondary">
                  {secondaryActionLabel}
                </Button>
              ) : null}
              <Button
                onClick={handlePrimaryAction}
                variant="primary"
                isLoading={isPrimaryActionLoading}>
                {primaryActionLabel}
              </Button>
            </>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
