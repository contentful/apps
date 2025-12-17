import { useState, useMemo, useCallback } from 'react';
import { SelectedContentType } from '../components/page/ContentTypePickerModal';

export const useProgressTracking = () => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [documentId, setDocumentId] = useState<string>('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<SelectedContentType[]>([]);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);

  const hasProgress = useMemo(
    () => hasStarted && documentId.trim().length > 0,
    [hasStarted, documentId]
  );

  const resetProgress = useCallback(() => {
    setHasStarted(false);
    setDocumentId('');
    setSelectedContentTypes([]);
  }, []);

  return {
    hasStarted,
    setHasStarted,
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
