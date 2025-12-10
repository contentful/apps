import { useState, useMemo, useCallback } from 'react';
import { SelectedContentType } from '../components/page/ContentTypePickerModal';

export const useProgressTracking = () => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [googleDocUrl, setGoogleDocUrl] = useState<string>('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<SelectedContentType[]>([]);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);

  const hasProgress = useMemo(
    () => hasStarted && googleDocUrl.trim().length > 0,
    [hasStarted, googleDocUrl]
  );

  const resetProgress = useCallback(() => {
    setHasStarted(false);
    setGoogleDocUrl('');
    setSelectedContentTypes([]);
  }, []);

  return {
    hasStarted,
    setHasStarted,
    googleDocUrl,
    setGoogleDocUrl,
    selectedContentTypes,
    setSelectedContentTypes,
    hasProgress,
    resetProgress,
    pendingCloseAction,
    setPendingCloseAction,
  };
};
