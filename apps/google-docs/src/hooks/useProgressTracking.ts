import { useState, useMemo, useCallback } from 'react';

export const useProgressTracking = () => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [googleDocUrl, setGoogleDocUrl] = useState<string>('');
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);

  const hasProgress = useMemo(
    () => hasStarted && googleDocUrl.trim().length > 0,
    [hasStarted, googleDocUrl]
  );

  const resetProgress = useCallback(() => {
    setHasStarted(false);
    setGoogleDocUrl('');
  }, []);

  return {
    hasStarted,
    setHasStarted,
    googleDocUrl,
    setGoogleDocUrl,
    hasProgress,
    resetProgress,
    pendingCloseAction,
    setPendingCloseAction,
  };
};
