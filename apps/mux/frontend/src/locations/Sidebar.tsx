import { Paragraph, Box, List, ListItem } from '@contentful/f36-components';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { FC, useEffect, useState } from 'react';
import {
  MuxContentfulObject,
  PendingAction,
  PendingActions,
  StaticRendition,
  Track,
} from '../util/types';

interface SidebarProps {
  sdk: SidebarExtensionSDK;
}

function getPendingActionById(
  actionsList: Array<Track> | Array<StaticRendition> | undefined,
  id: string,
  pendingActionFormat: string
) {
  if (!actionsList) return id;
  const found = actionsList.find((c) => c.id === id);
  if (found) {
    return `${pendingActionFormat} ${found.name || id}`;
  }
  return id;
}

const Sidebar: FC<SidebarProps> = ({ sdk }) => {
  const [pendingActionsList, setPendingActionsList] = useState<
    { fieldId: string; pendingActions: PendingActions; entryValue: MuxContentfulObject }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let detachFns: (() => void)[] = [];
    const fields = sdk.entry.fields;
    const fieldIds = Object.keys(fields);

    const updatePendingActions = async () => {
      const results: {
        fieldId: string;
        pendingActions: PendingActions;
        entryValue: MuxContentfulObject;
      }[] = [];
      for (const fieldId of fieldIds) {
        const value = await fields[fieldId].getValue();
        if (value && value.pendingActions) {
          results.push({ fieldId, pendingActions: value.pendingActions, entryValue: value });
        }
      }
      setPendingActionsList(results);
      setLoading(false);
    };

    updatePendingActions();

    detachFns = fieldIds.map((fieldId) =>
      fields[fieldId].onValueChanged(() => {
        updatePendingActions();
      })
    );

    return () => {
      detachFns.forEach((detach) => detach && detach());
    };
  }, [sdk]);

  if (loading) return <Paragraph>Loading...</Paragraph>;

  if (pendingActionsList.length === 0) {
    return <Paragraph>Asset is synchronized with Mux</Paragraph>;
  }

  const introText = 'The following changes will be applied to these assets when you Publish:';

  function renderDeletePendingAction(action: PendingAction, entryValue: MuxContentfulObject) {
    let name = '';
    const id = action.id as string;

    switch (action.type) {
      case 'caption': {
        name = getPendingActionById(entryValue.captions, id, 'Caption');
        break;
      }
      case 'audio': {
        name = getPendingActionById(entryValue.audioTracks, id, 'Audio');
        break;
      }
      case 'staticRendition': {
        name = getPendingActionById(entryValue.static_renditions, id, 'MP4 Rendition');
        break;
      }
      case 'asset': {
        name = 'Asset';
        break;
      }
      default:
        return `Pending action: ${action.type}`;
    }

    return `${name} will be removed`;
  }

  function renderUpdatePendingAction(action: PendingAction, entryValue: MuxContentfulObject) {
    let name = '';

    switch (action.type) {
      case 'metadata': {
        const oldTitle = entryValue.meta?.title ?? 'empty';
        name = `The asset's title will be updated to '${action.data?.title}' (formerly '${oldTitle}')`;
        break;
      }
      default:
        return `Pending action: ${action.type}`;
    }

    return name;
  }

  function getPlaybackSwitchText(pendingActions: PendingActions) {
    const createPlayback = (pendingActions.create || []).find(
      (a: PendingAction) => a.type === 'playback'
    );
    const deletePlayback = (pendingActions.delete || []).find(
      (a: PendingAction) => a.type === 'playback'
    );
    if (createPlayback && deletePlayback && createPlayback.data?.policy) {
      return `Playback will be switched to ${createPlayback.data.policy}`;
    }
    return null;
  }

  return (
    <Box>
      <Paragraph>{introText}</Paragraph>
      {pendingActionsList.map(({ fieldId, pendingActions, entryValue }) => {
        const playbackSwitchText = getPlaybackSwitchText(pendingActions);
        return (
          <Box key={fieldId} marginBottom="spacingM">
            <Paragraph>
              <strong>Field:</strong> {fieldId}
            </Paragraph>
            <List as="ul">
              {playbackSwitchText && <ListItem>{playbackSwitchText}</ListItem>}
              {pendingActions.delete && pendingActions.delete.length > 0 && (
                <>
                  {pendingActions.delete.map((action: PendingAction, idx: number) =>
                    playbackSwitchText && action.type === 'playback' ? null : (
                      <ListItem key={`delete-${idx}`}>
                        {renderDeletePendingAction(action, entryValue)}
                      </ListItem>
                    )
                  )}
                </>
              )}
              {pendingActions.update && pendingActions.update.length > 0 && (
                <>
                  {pendingActions.update.map((action: PendingAction, idx: number) => (
                    <ListItem key={`update-${idx}`}>
                      {renderUpdatePendingAction(action, entryValue)}
                    </ListItem>
                  ))}
                </>
              )}
            </List>
          </Box>
        );
      })}
    </Box>
  );
};

export default Sidebar;
