import { useCallback, useEffect, useRef, useState } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { callAppActionWithResult } from '../utils/appAction';

interface CheckStatusResponse {
  token: string;
  connected: boolean;
}

enum OAuthLoadingState {
  IDLE = 'idle',
  CHECKING = 'checking',
  CONNECTING = 'connecting',
  DISCONNECTING = 'disconnecting',
}

interface UseGoogleDriveOAuthResult {
  oauthToken: string;
  isOAuthConnected: boolean;
  isOAuthLoading: boolean;
  isOAuthBusy: boolean;
  startOAuth: () => Promise<void>;
  disconnectOAuth: () => Promise<void>;
  refreshOAuthStatus: (expectedStatus?: boolean, maxRetries?: number) => Promise<boolean>;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const checkGoogleDriveOAuthStatus = async (
  sdk: PageAppSDK,
  maxRetries: number = 1
): Promise<CheckStatusResponse> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callAppActionWithResult<CheckStatusResponse>(
        sdk,
        'checkGdocOauthTokenStatus',
        {}
      );
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        await delay(500 * attempt);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to check Google Drive connection status.');
};

export const useGoogleDriveOAuth = (sdk: PageAppSDK): UseGoogleDriveOAuthResult => {
  const [oauthToken, setOauthToken] = useState('');
  const [isOAuthConnected, setIsOAuthConnected] = useState(false);
  const [loadingState, setLoadingState] = useState<OAuthLoadingState>(OAuthLoadingState.CHECKING);
  const popupWindowRef = useRef<Window | null>(null);
  const popupClosePollRef = useRef<number | null>(null);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const isCompletingOAuthRef = useRef(false);

  const cleanup = useCallback(() => {
    if (messageHandlerRef.current) {
      window.removeEventListener('message', messageHandlerRef.current);
    }

    if (popupClosePollRef.current !== null) {
      window.clearInterval(popupClosePollRef.current);
      popupClosePollRef.current = null;
    }

    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.close();
    }

    popupWindowRef.current = null;
  }, []);

  const refreshOAuthStatus = useCallback(
    async (expectedStatus?: boolean, maxRetries: number = 5): Promise<boolean> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { connected, token } = await checkGoogleDriveOAuthStatus(sdk);
          const isConnected = connected === true;

          setOauthToken(token);
          setIsOAuthConnected(isConnected);

          if (
            expectedStatus === undefined ||
            isConnected === expectedStatus ||
            attempt === maxRetries
          ) {
            return isConnected;
          }
        } catch (error) {
          console.error(`Failed to check Google OAuth status (attempt ${attempt}):`, error);

          if (attempt === maxRetries) {
            setOauthToken('');
            setIsOAuthConnected(false);
            return false;
          }
        }

        await delay(500 * attempt);
      }

      return false;
    },
    [sdk]
  );

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      if (event.data?.type !== 'oauth:complete') {
        return;
      }

      isCompletingOAuthRef.current = true;

      try {
        await callAppActionWithResult<void>(sdk, 'completeGdocOauth', {
          code: event.data.code,
          state: event.data.state,
        });

        await refreshOAuthStatus(true);
      } catch (error) {
        console.error('Unable to complete Google OAuth connection:', error);
      } finally {
        isCompletingOAuthRef.current = false;
        cleanup();
        setLoadingState(OAuthLoadingState.IDLE);
      }
    },
    [cleanup, refreshOAuthStatus, sdk]
  );

  useEffect(() => {
    messageHandlerRef.current = (event: MessageEvent) => {
      void handleMessage(event);
    };
  }, [handleMessage]);

  const startOAuth = useCallback(async () => {
    setLoadingState(OAuthLoadingState.CONNECTING);

    if (messageHandlerRef.current) {
      window.removeEventListener('message', messageHandlerRef.current);
      window.addEventListener('message', messageHandlerRef.current);
    }

    try {
      const { authorizeUrl } = await callAppActionWithResult<{ authorizeUrl: string }>(
        sdk,
        'initiateGdocOauth',
        {}
      );

      const separator = authorizeUrl.includes('?') ? '&' : '?';
      const urlWithParams = `${authorizeUrl}${separator}access_type=offline&prompt=consent`;
      popupWindowRef.current = window.open(urlWithParams, '_blank', 'height=700,width=450');

      if (!popupWindowRef.current) {
        throw new Error('OAuth popup blocked.');
      }

      popupClosePollRef.current = window.setInterval(() => {
        if (popupWindowRef.current?.closed) {
          if (isCompletingOAuthRef.current) {
            return;
          }

          cleanup();
          setLoadingState(OAuthLoadingState.IDLE);
        }
      }, 500);
    } catch (error) {
      cleanup();
      setLoadingState(OAuthLoadingState.IDLE);
      sdk.notifier.error('Unable to connect to Drive Integration. Please try again.');
      throw error instanceof Error ? error : new Error('Unable to connect to Drive Integration.');
    }
  }, [cleanup, sdk]);

  const disconnectOAuth = useCallback(async () => {
    setLoadingState(OAuthLoadingState.DISCONNECTING);

    try {
      await callAppActionWithResult<void>(sdk, 'revokeGdocOauthToken', {});
      await refreshOAuthStatus(false);
    } catch (error) {
      sdk.notifier.error('Unable to disconnect from Drive Integration. Please try again.');
      throw error instanceof Error
        ? error
        : new Error('Unable to disconnect from Drive Integration.');
    } finally {
      setLoadingState(OAuthLoadingState.IDLE);
    }
  }, [refreshOAuthStatus, sdk]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      setLoadingState(OAuthLoadingState.CHECKING);

      try {
        await refreshOAuthStatus();
      } finally {
        if (isMounted) {
          setLoadingState(OAuthLoadingState.IDLE);
        }
      }
    };

    void initialize();

    return () => {
      isMounted = false;
      isCompletingOAuthRef.current = false;
      cleanup();
    };
  }, [cleanup, refreshOAuthStatus]);

  return {
    oauthToken,
    isOAuthConnected,
    isOAuthLoading: loadingState === OAuthLoadingState.CHECKING,
    isOAuthBusy: loadingState !== OAuthLoadingState.IDLE,
    startOAuth,
    disconnectOAuth,
    refreshOAuthStatus,
  };
};
