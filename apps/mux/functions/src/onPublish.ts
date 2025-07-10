import * as contentful from 'contentful-management';

async function deleteMuxResource({
  assetId,
  resourceId,
  context,
  resourceType, // 'playback-ids', 'tracks', 'static-renditions', ''
  logLabel,
}: {
  assetId: string;
  resourceId?: string;
  context: any;
  resourceType: string;
  logLabel: string;
}) {
  const { muxAccessTokenId, muxAccessTokenSecret } = context.appInstallationParameters;
  const credentials = btoa(`${muxAccessTokenId}:${muxAccessTokenSecret}`);

  let endpoint = `https://api.mux.com/video/v1/assets/${assetId}`;
  if (resourceType) {
    endpoint += `/${resourceType}`;
    if (resourceId) endpoint += `/${resourceId}`;
  }

  console.log(`Deleting ${logLabel} ${resourceId || ''} for assetId ${assetId}`);
  const deleteRes = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  });
  if (!deleteRes.ok) {
    const error = await deleteRes.json();
    throw new Error(`Error deleting ${logLabel}: ${error.error?.messages?.[0] || 'Unknown error'}`);
  }
}

async function removePendingActionsFromAllLocalesAndUpdate(
  fieldKey: string,
  cma: any,
  entryId: string,
  spaceId: string,
  environmentId: string
) {
  try {
    console.log(`Removing pendingActions and updating entry in Contentful for field ${fieldKey}.`);
    const updatedEntryFromContentful = await cma.entry.get({ entryId, spaceId, environmentId });
    const fieldValue = updatedEntryFromContentful.fields[fieldKey];
    for (const locale of Object.keys(fieldValue)) {
      if (
        fieldValue[locale] &&
        typeof fieldValue[locale] === 'object' &&
        'pendingActions' in fieldValue[locale]
      ) {
        fieldValue[locale].pendingActions = null;
      }
    }
    await cma.entry.update({ entryId, spaceId, environmentId }, updatedEntryFromContentful);
  } catch (err) {
    console.error(
      `There was an error removing pendingActions from all locales in ${fieldKey}:`,
      err
    );
    throw err;
  }
}

async function runPendingActionsFromEntry(
  entry: any,
  context: any,
  fieldsWithPendingActions: Record<string, any>
) {
  console.log('Running pending actions from entry');
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

  const failedPendingActions: Record<string, any> = {};

  for (const fieldKey of Object.keys(fieldsWithPendingActions)) {
    await removePendingActionsFromAllLocalesAndUpdate(
      fieldKey,
      cma,
      entryId,
      spaceId,
      environmentId
    );
    const pendingActions = fieldsWithPendingActions[fieldKey];
    const failedActions: { delete: any[]; create: any[]; update: any[] } = {
      delete: [],
      create: [],
      update: [],
    };

    if (pendingActions) {
      // Top priority: Delete asset
      const assetDeleteAction = Array.isArray(pendingActions.delete)
        ? pendingActions.delete.find((action: any) => action.type === 'asset')
        : undefined;
      if (assetDeleteAction) {
        try {
          await deleteMuxResource({
            assetId: pendingActions.assetId,
            context,
            resourceType: '',
            logLabel: 'asset',
          });
        } catch (err) {
          console.error(`Error in delete of asset for ${fieldKey}:`, err);
          const retry =
            typeof assetDeleteAction.retry === 'number' ? assetDeleteAction.retry + 1 : 1;
          failedActions.delete.push({ ...assetDeleteAction, retry });
        }
        if (failedActions.delete.length > 0) {
          failedPendingActions[fieldKey] = {
            delete: failedActions.delete,
            create: [],
            update: [],
          };
        }
        continue;
      }
      if (Array.isArray(pendingActions.delete)) {
        for (const deleteAction of pendingActions.delete) {
          try {
            switch (deleteAction.type) {
              case 'playback':
                await deleteMuxResource({
                  assetId: pendingActions.assetId,
                  resourceId: deleteAction.id,
                  context,
                  resourceType: 'playback-ids',
                  logLabel: 'playbackId',
                });
                break;
              case 'caption':
              case 'audio':
                await deleteMuxResource({
                  assetId: pendingActions.assetId,
                  resourceId: deleteAction.id,
                  context,
                  resourceType: 'tracks',
                  logLabel: 'track',
                });
                break;
              case 'staticRendition':
                await deleteMuxResource({
                  assetId: pendingActions.assetId,
                  resourceId: deleteAction.id,
                  context,
                  resourceType: 'static-renditions',
                  logLabel: 'static rendition',
                });
                break;
              default:
                console.warn(`Unsupported deleteAction type: ${deleteAction.type}`);
            }
          } catch (err) {
            console.error(`Error in delete of Mux for ${fieldKey}:`, err);
            const retry = typeof deleteAction.retry === 'number' ? deleteAction.retry + 1 : 1;
            failedActions.delete.push({ ...deleteAction, retry });
          }
        }
      }
      if (Array.isArray(pendingActions.create)) {
        for (const createAction of pendingActions.create) {
          try {
            switch (createAction.type) {
              case 'playback':
                await createMuxPlaybackId(
                  pendingActions.assetId,
                  createAction.data?.policy,
                  context
                );
                break;
              default:
                console.warn(`Unsupported deleteAction type: ${createAction.type}`);
            }
          } catch (err) {
            console.error(`Error in create of Mux for ${fieldKey}:`, err);
            const retry = typeof createAction.retry === 'number' ? createAction.retry + 1 : 1;
            failedActions.create.push({ ...createAction, retry });
          }
        }
      }
      if (Array.isArray(pendingActions.update)) {
        for (const updateAction of pendingActions.update) {
          try {
            switch (updateAction.type) {
              case 'metadata':
                await updateMuxAsset(pendingActions.assetId, updateAction.data, context);
                break;
              default:
                console.warn(`Unsupported deleteAction type: ${updateAction.type}`);
            }
          } catch (err) {
            console.error(`Error in update of Mux for ${fieldKey}:`, err);
            const retry = typeof updateAction.retry === 'number' ? updateAction.retry + 1 : 1;
            failedActions.update.push({ ...updateAction, retry });
          }
        }
      }
    }

    if (
      failedActions.delete.length > 0 ||
      failedActions.create.length > 0 ||
      failedActions.update.length > 0
    ) {
      failedPendingActions[fieldKey] = {
        delete: failedActions.delete,
        create: failedActions.create,
        update: failedActions.update,
      };
    }
  }

  console.log(
    'Finished running pending actions from entry. Failed pending actions:',
    failedPendingActions
  );
  return failedPendingActions;
}

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
  if (res.status === 404) {
    return undefined;
  }
  if (!res.ok) {
    const error = await res.json();
    throw new Error(
      `Error getting asset from Mux: ${error.error?.messages?.[0] || 'Unknown error'}`
    );
  }
  const { data } = await res.json();
  return data;
}

async function updateEntryFieldWithMuxAsset(
  entry: any,
  context: any,
  entriesWithFailedActions: Record<string, any>
) {
  console.log('Updating entry field with Mux asset');
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

  for (const [fieldId, fieldValue] of Object.entries(entryFromContentful.fields)) {
    if (fieldValue && typeof fieldValue === 'object') {
      const [_, localeValue] = Object.entries(fieldValue)[0] || [];
      if (localeValue && typeof localeValue === 'object' && (localeValue as any).assetId) {
        const assetId = (localeValue as any).assetId;
        try {
          const muxAsset = await fetchMuxAsset(assetId, context);

          if (muxAsset === undefined) {
            entryFromContentful.fields[fieldId] = undefined;
            continue;
          }

          const publicPlayback = Array.isArray(muxAsset.playback_ids)
            ? muxAsset.playback_ids.find((p: any) => p.policy === 'public')
            : undefined;
          const signedPlayback = Array.isArray(muxAsset.playback_ids)
            ? muxAsset.playback_ids.find((p: any) => p.policy === 'signed')
            : undefined;

          const audioTracks = muxAsset.tracks?.filter((t: any) => t.type === 'audio');
          const captions = muxAsset.tracks?.filter((t: any) => t.type === 'text');

          let updatedField: any = {
            version: 1,
            uploadId: muxAsset.upload_id || undefined,
            assetId: muxAsset.id,
            playbackId: publicPlayback?.id || undefined,
            signedPlaybackId: signedPlayback?.id || undefined,
            ready: muxAsset.status === 'ready',
            ratio: muxAsset.aspect_ratio || undefined,
            max_stored_resolution: muxAsset.max_stored_resolution || undefined,
            max_stored_frame_rate: muxAsset.max_stored_frame_rate || undefined,
            duration: muxAsset.duration || undefined,
            audioOnly:
              'max_stored_resolution' in muxAsset &&
              muxAsset.max_stored_resolution === 'Audio only',
            error: muxAsset.errors?.length ? muxAsset.errors[0].message : undefined,
            created_at: muxAsset.created_at ? Number(muxAsset.created_at) : undefined,
            ...(captions?.length && { captions }),
            ...(audioTracks?.length && { audioTracks }),
            static_renditions: muxAsset.static_renditions?.files || undefined,
            is_live: muxAsset.is_live || undefined,
            live_stream_id: muxAsset.live_stream_id || undefined,
            meta: muxAsset.meta || undefined,
            passthrough: muxAsset.passthrough || undefined,
            ...(entriesWithFailedActions[fieldId] && {
              pendingActions: entriesWithFailedActions[fieldId],
            }),
          };

          for (const locale of Object.keys(entryFromContentful.fields[fieldId])) {
            entryFromContentful.fields[fieldId][locale] = updatedField;
          }
        } catch (err) {
          console.error(`Error updating field ${fieldId} with assetId ${assetId}:`, err);
        }
      }
    }
  }

  const updatedEntry = await cma.entry.update(
    { entryId, spaceId, environmentId },
    entryFromContentful
  );
  await cma.entry.publish({ entryId, spaceId, environmentId }, updatedEntry);
  console.log('Entry updated and published with fresh Mux data');
}

function findPendingActionsInMuxFields(fields: any): Record<string, any> {
  const pendingActionsMap: Record<string, any> = {};
  if (!fields || typeof fields !== 'object') {
    return pendingActionsMap;
  }

  for (const [fieldKey, fieldValue] of Object.entries(fields)) {
    if (fieldValue && typeof fieldValue === 'object') {
      const firstLocaleValue = Object.values(fieldValue)[0];
      if (
        firstLocaleValue &&
        typeof firstLocaleValue === 'object' &&
        'assetId' in firstLocaleValue &&
        'pendingActions' in firstLocaleValue
      ) {
        const pendingActions = firstLocaleValue.pendingActions;
        const filteredActions: any = {};
        let hasValidAction = false;
        ['delete', 'create', 'update'].forEach((actionType) => {
          if (Array.isArray(pendingActions[actionType])) {
            const filtered = pendingActions[actionType].filter(
              (action: any) => typeof action.retry === 'number' && action.retry <= 3
            );
            if (filtered.length > 0) {
              filteredActions[actionType] = filtered;
              hasValidAction = true;
            }
          }
        });
        if (hasValidAction) {
          pendingActionsMap[fieldKey] = {
            ...filteredActions,
            assetId: firstLocaleValue.assetId,
          };
        }
      }
    }
  }

  console.log('Pending actions map:', pendingActionsMap);
  return pendingActionsMap;
}

async function createMuxPlaybackId(assetId: string, policy: string, context: any) {
  console.log(`Creating playbackId for assetId ${assetId} with policy ${policy}`);
  const { muxAccessTokenId, muxAccessTokenSecret } = context.appInstallationParameters;
  const credentials = btoa(`${muxAccessTokenId}:${muxAccessTokenSecret}`);

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
    throw new Error(`Error creating playbackId: ${error.error?.messages?.[0] || 'Unknown error'}`);
  }
}

async function updateMuxAsset(assetId: string, data: any, context: any) {
  console.log(`Updating Mux asset for assetId ${assetId} with data ${data}`);
  const { muxAccessTokenId, muxAccessTokenSecret } = context.appInstallationParameters;
  const credentials = btoa(`${muxAccessTokenId}:${muxAccessTokenSecret}`);

  const requestBody = JSON.stringify({
    meta: {
      title: data.title,
    },
  });

  const updateRes = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });

  if (!updateRes.ok) {
    const error = await updateRes.json();
    throw new Error(`Error updating Mux asset: ${error.error?.messages?.[0] || 'Unknown error'}`);
  }
}

export const handler = async (event: any, context: any) => {
  console.log('=== START OF HANDLER ===');
  console.log('Event:', JSON.stringify(event, null, 2));

  if (event.type !== 'appevent.handler') {
    console.log('Unsupported event type:', event.type);
    return;
  }

  const fieldsWithPendingActions = findPendingActionsInMuxFields((event.body as any)?.fields);
  if (Object.keys(fieldsWithPendingActions).length === 0) {
    console.log('No pendingActions found in Mux fields, exiting...');
    return;
  }

  try {
    const entry = event.body;

    const entriesWithFailedActions = await runPendingActionsFromEntry(
      entry,
      context,
      fieldsWithPendingActions
    );
    await updateEntryFieldWithMuxAsset(entry, context, entriesWithFailedActions);
  } catch (error) {
    console.error('Error processing event:', error);
    throw error;
  }
  console.log('=== END OF HANDLER ===');
};
