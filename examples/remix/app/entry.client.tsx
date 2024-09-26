/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { init } from '@contentful/app-sdk';
import { KnownAppSDK } from '@contentful/app-sdk/dist/types';

startTransition(() => {
  init((sdk: KnownAppSDK) => {
    // @ts-expect-error App SDK is not defined in Remix
    window.__SDK__ = sdk;
    hydrateRoot(
      document,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>
    );
  });
});
