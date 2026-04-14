import { useCallback, useRef, useState } from 'react';
import { Button, Flex, Heading, Layout } from '@contentful/f36-components';
import type { ImageSourceRef, MappingReviewSuspendPayload } from '@types';
import Splitter from './Splitter';
import { ConfirmCancelModal } from '../modals/ConfirmCancelModal';
import { MappingReviewAssignModal } from '../modals/MappingReviewAssignModal';
import { MappingReviewExcludeModal } from '../modals/MappingReviewExcludeModal';
import { DocumentOutline } from '../review/DocumentOutline';
import { SelectionActionMenu } from '../review/SelectionActionMenu';
import { useReviewTextSelection } from '../review/useReviewTextSelection';

interface MappingReviewPageProps {
  payload: MappingReviewSuspendPayload;
  onLeaveReview: () => void;
}

export const MappingReviewPage = ({ payload, onLeaveReview }: MappingReviewPageProps) => {
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isExcludeModalOpen, setIsExcludeModalOpen] = useState(false);
  const [assignValueLabel, setAssignValueLabel] = useState('');
  const [excludeValueLabel, setExcludeValueLabel] = useState('');

  const reviewDocumentRootRef = useRef<HTMLDivElement>(null);
  const { anchorRect, clearSelection } = useReviewTextSelection(reviewDocumentRootRef);

  const openAssignModal = useCallback(() => {
    const text = window.getSelection()?.toString().trim() ?? '';
    setAssignValueLabel(text);
    setIsExcludeModalOpen(false);
    setIsAssignModalOpen(true);
    clearSelection();
  }, [clearSelection]);

  const openExcludeModal = useCallback(() => {
    const text = window.getSelection()?.toString().trim() ?? '';
    setExcludeValueLabel(text);
    setIsAssignModalOpen(false);
    setIsExcludeModalOpen(true);
    clearSelection();
  }, [clearSelection]);

  const handleImageAssign = useCallback((_sourceRef: ImageSourceRef, assetDisplayName: string) => {
    setAssignValueLabel(assetDisplayName);
    setIsExcludeModalOpen(false);
    setIsAssignModalOpen(true);
  }, []);

  const handleImageExclude = useCallback((_sourceRef: ImageSourceRef, assetDisplayName: string) => {
    setExcludeValueLabel(assetDisplayName);
    setIsAssignModalOpen(false);
    setIsExcludeModalOpen(true);
  }, []);

  const closeAssignModal = useCallback(() => {
    setIsAssignModalOpen(false);
    setAssignValueLabel('');
  }, []);

  const closeExcludeModal = useCallback(() => {
    setIsExcludeModalOpen(false);
    setExcludeValueLabel('');
  }, []);

  const documentTitle =
    payload.normalizedDocument.title ?? payload.documentTitle ?? 'Selected document';
  const title = `Create from document "${documentTitle}"`;

  return (
    <>
      <Layout.Header title="Preview">
        <Flex justifyContent="space-between" alignItems="center" marginTop="spacingS">
          <Heading marginBottom="none">{title}</Heading>
          <Button
            variant="transparent"
            size="small"
            onClick={() => setIsConfirmCancelModalOpen(true)}
            aria-label="Cancel preview">
            Cancel
          </Button>
        </Flex>
      </Layout.Header>
      <Splitter marginTop="spacingS" />
      <Layout.Body>
        <DocumentOutline
          payload={payload}
          reviewDocumentRootRef={reviewDocumentRootRef}
          onImageAssign={handleImageAssign}
          onImageExclude={handleImageExclude}
        />
      </Layout.Body>
      {anchorRect ? (
        <SelectionActionMenu
          anchorRect={anchorRect}
          onAssign={openAssignModal}
          onExclude={openExcludeModal}
        />
      ) : null}
      <ConfirmCancelModal
        isOpen={isConfirmCancelModalOpen}
        onConfirm={onLeaveReview}
        onCancel={() => setIsConfirmCancelModalOpen(false)}
      />
      <MappingReviewAssignModal
        isOpen={isAssignModalOpen}
        valueLabel={assignValueLabel}
        onClose={closeAssignModal}
      />
      <MappingReviewExcludeModal
        isOpen={isExcludeModalOpen}
        valueLabel={excludeValueLabel}
        onClose={closeExcludeModal}
      />
    </>
  );
};
