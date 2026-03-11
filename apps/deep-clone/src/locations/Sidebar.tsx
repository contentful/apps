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

  const openReferencesDialog = async (
    tree: Record<string, any>,
    entryId: string,
    listBlockContentIds: string[] = [] // Example: ['alternateBackground']
  ): Promise<string[] | null> => {
    try {
      const dialogResult = await sdk.dialogs.openCurrentApp({
        title: 'Deep Clone Selection (Select entries to clone)',
        position: 'center',
        shouldCloseOnOverlayClick: true,
        shouldCloseOnEscapePress: true,
        width: 1100,
        minHeight: '70vh',
        parameters: {
          referencesTree: JSON.parse(JSON.stringify(tree)) as any,
          parentEntryId: entryId,
          listBlockContentIds: listBlockContentIds,
        } as any,
      });

      // If dialog was closed (Close button clicked), return null
      if (!dialogResult || dialogResult === null) {
        return null;
      }

      return dialogResult as string[];
    } catch (_error) {
      sdk.notifier.error('Failed to open dialog');
      return null;
    }
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
    const tree = await cloner.getReferencesTree();
    const selectedComponentIds = await openReferencesDialog(
      tree,
      sdk.ids.entry,
      parameters.referenceOnlyComponents.map((component) => component.id)
    );
    if (!selectedComponentIds || selectedComponentIds.length === 0) {
      resetState();
      return;
    }

    cloner.shouldCloneComponents = selectedComponentIds;
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
