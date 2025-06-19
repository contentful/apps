import type {
  FunctionEventHandler,
  FunctionTypeEnum,
  AppEventRequest,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit';
import * as contentful from 'contentful-management';

type InstallationParameters = {
  muxAccessTokenId: string;
  muxAccessTokenSecret: string;
};

interface ExtendedContext {
  appInstallationParameters: InstallationParameters;
  cmaClientOptions: any;
}

type CombinedContext = ExtendedContext;

// Use any for the event type since the Contentful types are complex
type EventHandler = (event: any, context: CombinedContext) => Promise<void>;

interface AssetSettings {
  passthrough?: string;
  meta?: {
    title?: string;
    creator_id?: string;
    external_id?: string;
  };
}

interface MuxFieldValue {
  assetId: string;
  [key: string]: any;
}

// Function to update assets using fetch directly to the Mux API
async function updateAsset(context: any, assetId: string, settings: any) {
  const { muxAccessTokenId, muxAccessTokenSecret } = context.appInstallationParameters;

  // Create basic credentials for authentication
  const credentials = btoa(`${muxAccessTokenId}:${muxAccessTokenSecret}`);

  const requestBody: any = {
    meta: settings.meta || {
      title: '',
      creator_id: '',
      external_id: '',
    },
    passthrough: settings.passthrough || '',
  };

  const response = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error updating asset: ${error.error?.messages?.[0] || 'Unknown error'}`);
  }

  return response.json();
}

// Function to make the swap of playbackId using data from pendingActions
async function swapPlaybackIdFromPendingActions(
  assetId: string,
  playbackId: string,
  policy: string,
  context: any
) {
  const { muxAccessTokenId, muxAccessTokenSecret } = context.appInstallationParameters;
  const credentials = btoa(`${muxAccessTokenId}:${muxAccessTokenSecret}`);

  // Delete old playbackId
  const deleteRes = await fetch(
    `https://api.mux.com/video/v1/assets/${assetId}/playback-ids/${playbackId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!deleteRes.ok) {
    const error = await deleteRes.json();
    console.error('Error deleting playbackId:', error);
    return;
  }

  // Create new playbackId
  const createRes = await fetch(`https://api.mux.com/video/v1/assets/${assetId}/playback-ids`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ policy }),
  });
  if (!createRes.ok) {
    const error = await createRes.json();
    console.error('Error creating playbackId:', error);
    return;
  }

  console.log(`PlaybackId ${playbackId} deleted and created a new one with policy ${policy}`);
}

// Function to delete pendingActions from the entry in Contentful and make swap if applicable
async function deletePendingActionsFromEntry(entry: any, context: any) {
  const {
    sys: {
      id: entryId,
      environment: {
        sys: { id: environmentId },
      },
      space: {
        sys: { id: spaceId },
      },
    },
  } = entry;

  const cma = contentful.createClient(context.cmaClientOptions, {
    defaults: { spaceId, environmentId },
    type: 'plain',
  });

  const entryFromContentful = await cma.entry.get({ entryId, spaceId, environmentId });
  console.log('DEBUG entryFromContentful:', JSON.stringify(entryFromContentful, null, 2));

  let hasPendingActions = false;

  // Iterate over all fields and take only the first locale for swap, but delete pendingActions from all locales
  for (const [fieldId, fieldValue] of Object.entries(entryFromContentful.fields)) {
    if (fieldValue && typeof fieldValue === 'object') {
      // Find the first locale with pendingActions and swap data
      let swapDone = false;
      for (const [locale, localeValue] of Object.entries(fieldValue)) {
        if (localeValue && typeof localeValue === 'object' && 'pendingActions' in localeValue) {
          const pending = (localeValue as any).pendingActions;
          const deletePlayback = Array.isArray(pending.delete)
            ? pending.delete.find((d: any) => d.type === 'playback' && d.id)
            : null;
          const createPlayback = Array.isArray(pending.create)
            ? pending.create.find((c: any) => c.type === 'playback' && c.data?.policy)
            : null;
          const assetId = (localeValue as any).assetId;

          // Call swap only once per field
          if (!swapDone && deletePlayback && createPlayback && assetId) {
            console.log(
              `Executing swapPlaybackId for assetId ${assetId}, playbackId ${deletePlayback.id}, policy ${createPlayback.data.policy}`
            );
            await swapPlaybackIdFromPendingActions(
              assetId,
              deletePlayback.id,
              createPlayback.data.policy,
              context
            );
            swapDone = true;
          }

          // Delete pendingActions from all locales
          console.log(`Deleting pendingActions from field ${fieldId}, locale ${locale}`);
          delete (localeValue as any).pendingActions;
          hasPendingActions = true;
        }
      }
    }
  }

  if (hasPendingActions) {
    console.log('Deleting pendingActions from entry in Contentful...');
    const updated = await cma.entry.update(
      { entryId, spaceId, environmentId },
      entryFromContentful
    );
    // await cma.entry.publish({ entryId, spaceId, environmentId }, updated);
    console.log('pendingActions deleted successfully from entry');
  } else {
    console.log('No pendingActions found in entry');
  }
}

// Function to process a Mux field independently of its locale
async function processMuxField(fieldValue: any, context: any) {
  console.log('Processing Mux field:', fieldValue);

  if (fieldValue && typeof fieldValue === 'object') {
    console.log('The field is an object, searching locales...');
    const locales = Object.keys(fieldValue);
    console.log('Locales found:', locales);

    for (const localeValue of Object.values(fieldValue)) {
      console.log('Processing value of locale:', localeValue);

      if (localeValue && typeof localeValue === 'object' && 'assetId' in localeValue) {
        console.log('Found assetId in the locale');
        const assetId = (localeValue as any).assetId;
        console.log('AssetId found:', assetId);

        if (assetId) {
          try {
            console.log('Attempting to update asset:', assetId);
            const response = await updateAsset(context, assetId, {
              passthrough: 'Edited by the function!',
            });
            console.log('Mux response:', response);
            console.log(`Asset ${assetId} updated successfully`);
          } catch (error) {
            console.error(`Error updating asset ${assetId}:`, error);
          }
        } else {
          console.log('AssetId is empty, skipping...');
        }
      } else {
        console.log('No assetId found in the locale or the value is not an object');
      }
    }
  } else {
    console.log('The field is not an object, skipping...');
  }
}

// Function to get Mux asset
async function fetchMuxAsset(assetId: string, context: any) {
  const { muxAccessTokenId, muxAccessTokenSecret } = context.appInstallationParameters;
  const credentials = btoa(`${muxAccessTokenId}:${muxAccessTokenSecret}`);
  const res = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(
      `Error getting asset from Mux: ${error.error?.messages?.[0] || 'Unknown error'}`
    );
  }
  const { data } = await res.json();
  return data;
}

// Function to update Mux field in Contentful with fresh data from Mux asset
async function updateEntryFieldWithMuxAsset(entry: any, context: any) {
  const {
    sys: {
      id: entryId,
      environment: {
        sys: { id: environmentId },
      },
      space: {
        sys: { id: spaceId },
      },
    },
  } = entry;

  const cma = contentful.createClient(context.cmaClientOptions, {
    defaults: { spaceId, environmentId },
    type: 'plain',
  });

  const entryFromContentful = await cma.entry.get({ entryId, spaceId, environmentId });
  let updated = false;

  for (const [fieldId, fieldValue] of Object.entries(entryFromContentful.fields)) {
    if (fieldValue && typeof fieldValue === 'object') {
      const [locale, localeValue] = Object.entries(fieldValue)[0] || [];
      if (localeValue && typeof localeValue === 'object' && (localeValue as any).assetId) {
        const assetId = (localeValue as any).assetId;
        try {
          const muxAsset = await fetchMuxAsset(assetId, context);

          // Adapt the asset structure for Contentful
          const publicPlayback = Array.isArray(muxAsset.playback_ids)
            ? muxAsset.playback_ids.find((p: any) => p.policy === 'public')
            : undefined;
          const signedPlayback = Array.isArray(muxAsset.playback_ids)
            ? muxAsset.playback_ids.find((p: any) => p.policy === 'signed')
            : undefined;

          const updatedField = {
            version: muxAsset.master?.version || 1,
            uploadId: muxAsset.upload_id || undefined,
            assetId: muxAsset.id,
            playbackId: publicPlayback?.id || undefined,
            signedPlaybackId: signedPlayback?.id || undefined,
            ready: muxAsset.status === 'ready',
            ratio: muxAsset.aspect_ratio || undefined,
            max_stored_resolution: muxAsset.max_stored_resolution || undefined,
            max_stored_frame_rate: muxAsset.max_stored_frame_rate || undefined,
            duration: muxAsset.duration || undefined,
            audioOnly: muxAsset.master?.audio_only || false,
            error: muxAsset.errors?.length ? muxAsset.errors[0].message : undefined,
            created_at: muxAsset.created_at ? Number(muxAsset.created_at) : undefined,
            captions: muxAsset.tracks?.filter((t: any) => t.type === 'text') || [],
            audioTracks: muxAsset.tracks?.filter((t: any) => t.type === 'audio') || [],
            static_renditions: muxAsset.static_renditions?.files || undefined,
            is_live: muxAsset.is_live || undefined,
            live_stream_id: muxAsset.live_stream_id || undefined,
            meta: muxAsset?.master?.meta || undefined,
            passthrough: muxAsset.passthrough || undefined,
            // No add pendingActions because it was deleted
          };

          console.log('NEW FIELDS IN CONTENTFUL:', JSON.stringify(updatedField, null, 2));

          // Update field in entry
          entryFromContentful.fields[fieldId][locale] = updatedField;
          updated = true;
          console.log(`Field ${fieldId} updated with fresh Mux data for locale ${locale}`);
        } catch (err) {
          console.error(`Error updating field ${fieldId} with assetId ${assetId}:`, err);
        }
      }
    }
  }

  if (updated) {
    const updatedEntry = await cma.entry.update(
      { entryId, spaceId, environmentId },
      entryFromContentful
    );
    await cma.entry.publish({ entryId, spaceId, environmentId }, updatedEntry);
    console.log('Entry updated and published with fresh Mux data');
  } else {
    console.log('No fields updated with Mux data');
  }
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  console.log('=== START OF HANDLER ===');
  console.log('Event type:', event.type);
  console.log('Event complete:', JSON.stringify(event, null, 2));

  // Validate event type
  if (event.type !== 'appevent.handler') {
    console.log('Unsupported event type:', event.type);
    return;
  }

  // Find pendingActions in Mux fields
  const hasPendingActions = findPendingActionsInMuxFields((event.body as any)?.fields);
  if (!hasPendingActions) {
    console.log('No pendingActions found in Mux fields, exiting...');
    return;
  }

  console.log('pendingActions found in Mux fields, proceeding with processing...');

  try {
    console.log('Processing event appevent.handler');
    const entries = Array.isArray(event.body) ? event.body : [event.body];
    console.log('Number of entries to process:', entries.length);

    for (const entry of entries) {
      console.log('Processing entry:', entry.sys?.id);
      console.log('Available fields:', Object.keys(entry.fields));

      // Delete pendingActions from entry in Contentful
      await deletePendingActionsFromEntry(entry, context);

      // Process Mux fields
      for (const [fieldId, fieldValue] of Object.entries(entry.fields)) {
        console.log(`\nProcessing field: ${fieldId}`);
        await processMuxField(fieldValue, context);
      }

      // Update Mux field in Contentful with fresh data from Mux asset
      await updateEntryFieldWithMuxAsset(entry, context);
    }
  } catch (error) {
    console.error('Error processing event:', error);
    throw error;
  }
  console.log('=== END OF HANDLER ===');
};

// Function to find pendingActions in Mux fields
function findPendingActionsInMuxFields(fields: any): boolean {
  if (!fields || typeof fields !== 'object') {
    return false;
  }

  for (const fieldValue of Object.values(fields)) {
    if (fieldValue && typeof fieldValue === 'object') {
      // Search only in the first locale
      const firstLocaleValue = Object.values(fieldValue)[0];
      if (
        firstLocaleValue &&
        typeof firstLocaleValue === 'object' &&
        'assetId' in firstLocaleValue
      ) {
        // If we find an assetId, check if it has pendingActions
        if ('pendingActions' in firstLocaleValue) {
          console.log('Found pendingActions in Mux field');
          return true;
        } else {
          // If we find an assetId but no pendingActions, exit the loop
          console.log('Found assetId but no pendingActions, exiting...');
          break;
        }
      }
    }
  }

  return false;
}
