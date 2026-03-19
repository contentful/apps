import { useState, useCallback } from 'react';
import { ContentTypeProps } from 'contentful-management';
import { DocumentTabProps } from '../utils/types';

export const useProgressTracking = () => {
  const [documentId, setDocumentId] = useState<string>('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeProps[]>([]);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);
  const [availableTabs, setAvailableTabs] = useState<DocumentTabProps[]>([]);
  const [selectedTabs, setSelectedTabs] = useState<DocumentTabProps[]>([]);

  const hasProgress = documentId.trim().length > 0;

  const resetProgress = useCallback(() => {
    setDocumentId('');
    setSelectedContentTypes([]);
    setAvailableTabs([]);
    setSelectedTabs([]);
  }, []);

  return {
    documentId,
    setDocumentId,
    selectedContentTypes,
    setSelectedContentTypes,
    availableTabs,
    setAvailableTabs,
    selectedTabs,
    setSelectedTabs,
    hasProgress,
    resetProgress,
    pendingCloseAction,
    setPendingCloseAction,
  };
};
