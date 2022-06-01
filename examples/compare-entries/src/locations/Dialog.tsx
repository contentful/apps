import { DialogExtensionSDK } from '@contentful/app-sdk';
import { Spinner, Stack } from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { EntryProps, GetEntryParams, PlainClientAPI } from 'contentful-management';
import React, { useEffect, useState } from 'react';
import DiffViewer from 'react-diff-viewer';

const Dialog = () => {
  const sdk = useSDK<DialogExtensionSDK>();
  const cma = useCMA();
  const [leftEntry, setLeftEntry] = useState<EntryProps | null | undefined>();
  const [rightEntry, setRightEntry] = useState<EntryProps | null | undefined>();

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  useEffect(() => {
    (async () => {
      const { leftEntry: leftEntryParams, rightEntry: rightEntryParams } = sdk.parameters
        .invocation as any;

      const [le, re] = await Promise.all([
        fetchEntry(cma, leftEntryParams),
        fetchEntry(cma, rightEntryParams),
      ]);
      setLeftEntry(le);
      setRightEntry(re);
    })();
  }, [cma, sdk.parameters.invocation]);

  return (
    <>
      {leftEntry === undefined || rightEntry === undefined ? (
        <Stack flexDirection="column">
          <Spinner customSize={50} />
        </Stack>
      ) : (
        <DiffViewer
          oldValue={JSON.stringify(leftEntry, undefined, 2)}
          newValue={JSON.stringify(rightEntry, undefined, 2)}
          splitView
        />
      )}
    </>
  );
};

export default Dialog;

async function fetchEntry(
  cma: PlainClientAPI,
  options: GetEntryParams
): Promise<EntryProps | null> {
  try {
    return await cma.entry.get(options);
  } catch {
    return null;
  }
}
