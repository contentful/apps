import { useEffect, useState } from 'react';
import { Text, Button, Stack } from '@contentful/f36-components';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import EntryCloner from '../utils/EntryCloner';
import { useInstallationParameters } from '../utils/useInstallationParameters';
import { AppParameters } from '@/vite-env';

function Sidebar() {
  const REDIRECT_DELAY = 3000;
  const sdk = useSDK() as SidebarAppSDK;
  useAutoResizer();

  const [referencesCount, setReferencesCount] = useState<number>(0);
  const [clonesCount, setClonesCount] = useState<number>(0);
  const [updatesCount, setUpdatesCount] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(0);
  const parameters = useInstallationParameters(sdk) as AppParameters;

  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  useEffect(() => {
    if (countdown === 0) return;

    const interval = setInterval(() => {
      setCountdown((currentCountdown) => {
        if (currentCountdown <= 1) {
          clearInterval(interval);
          return 0;
        }
        return currentCountdown - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const resetState = () => {
    setIsConfirming(false);
    setIsCloning(false);
    setIsFinished(false);
    setIsRedirecting(false);
    setReferencesCount(0);
    setClonesCount(0);
    setUpdatesCount(0);
  };

  const clone = async (): Promise<void> => {
    resetState();
    setIsConfirming(true);
    await sdk.entry.save();
    const cloner = new EntryCloner(
      sdk.cma,
      parameters,
      sdk.ids.entry,
      setReferencesCount,
      setClonesCount,
      setUpdatesCount
    );
    const referencesQty = await cloner.getReferencesQty();
    const confirmation = await sdk.dialogs.openConfirm({
      title: 'Clone entry',
      message: `Are you sure you want to clone this entry? This will create ${referencesQty} new entries.`,
    });
    if (!confirmation) {
      resetState();
      return;
    }
    setIsConfirming(false);
    setIsCloning(true);

    const clonedEntry = await cloner.cloneEntry();

    setIsCloning(false);
    setIsFinished(true);

    if (parameters.automaticRedirect) {
      setIsRedirecting(true);
      setCountdown(REDIRECT_DELAY / 1000);
      setTimeout(() => {
        sdk.navigator.openEntry(clonedEntry.sys.id);
      }, REDIRECT_DELAY);
    }
    sdk.notifier.success('Clone successful');
  };

  return (
    <Stack spacing="spacingM" flexDirection="column" alignItems="start">
      <Text fontColor="gray500" fontWeight="fontWeightMedium">
        Clone this entry and all referenced entries
      </Text>
      <Button
        variant="secondary"
        isLoading={isCloning}
        isDisabled={isConfirming || isCloning || isRedirecting}
        onClick={clone}
        isFullWidth>
        Clone entry
      </Button>

      <Stack spacing="spacing2Xs" flexDirection="column" alignItems="start">
        {(isConfirming || isCloning || isRedirecting || isFinished) && (
          <Text fontColor="gray500" fontWeight="fontWeightMedium">
            {`Found ${referencesCount} ${referencesCount === 1 ? 'reference' : 'references'}.`}
          </Text>
        )}
        {(isCloning || isRedirecting || isFinished) && (
          <>
            <Text fontColor="gray500" fontWeight="fontWeightMedium">
              {`Created ${clonesCount} new ${
                clonesCount === 1 ? 'entry' : 'entries'
              } out of ${referencesCount}.`}
            </Text>
            <Text fontColor="gray500" fontWeight="fontWeightMedium">
              {`Updated ${updatesCount} ${updatesCount === 1 ? 'reference' : 'references'}.`}
            </Text>
          </>
        )}
      </Stack>
      {isRedirecting && parameters.automaticRedirect && (
        <Text fontColor="gray500" fontWeight="fontWeightMedium">
          Redirecting to newly created clone in {countdown} seconds
        </Text>
      )}
    </Stack>
  );
}

export default Sidebar;
