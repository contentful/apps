import { useState, useCallback } from 'react';
import { ContentTypeProps } from 'contentful-management';
import { DocumentTabProps } from '../locations/Page/components/modals/step_3/SelectTabsModal';

export const useProgressTracking = () => {
  const [documentId, setDocumentId] = useState<string>('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeProps[]>([]);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);
  const [selectedTabs, setSelectedTabs] = useState<DocumentTabProps[]>([]);

  const hasProgress = documentId.trim().length > 0;

  const resetProgress = useCallback(() => {
    setDocumentId('');
    setSelectedContentTypes([]);
    setSelectedTabs([]);
  }, []);

  return {
    documentId,
    setDocumentId,
    selectedContentTypes,
    setSelectedContentTypes,
    selectedTabs,
    setSelectedTabs,
    hasProgress,
    resetProgress,
    pendingCloseAction,
    setPendingCloseAction,
  };
};
