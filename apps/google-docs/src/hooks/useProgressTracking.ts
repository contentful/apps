import { useState, useCallback } from 'react';
import { SelectedContentType } from '../components/page/ContentTypePickerModal';

export const useProgressTracking = () => {
  const [documentId, setDocumentId] = useState<string>('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<SelectedContentType[]>([]);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);

  const hasProgress = documentId.trim().length > 0;

  const resetProgress = useCallback(() => {
    setDocumentId('');
    setSelectedContentTypes([]);
  }, []);

  return {
    documentId,
    setDocumentId,
    selectedContentTypes,
    setSelectedContentTypes,
    hasProgress,
    resetProgress,
    pendingCloseAction,
    setPendingCloseAction,
  };
};
