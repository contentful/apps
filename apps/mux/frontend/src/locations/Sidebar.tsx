import { Paragraph, Box, List, ListItem } from '@contentful/f36-components';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { FC, useEffect, useState } from 'react';

interface SidebarProps {
  sdk: SidebarExtensionSDK;
}

function getCaptionNameById(captions: any[] | undefined, id: string) {
  if (!captions) return id;
  const found = captions.find((c) => c.id === id);
  if (found) {
    return `Caption ${found.name || found.language_code || id}`;
  }
  return id;
}

function getRenditionNameById(renditions: any[] | undefined, id: string) {
  if (!renditions) return id;
  const found = renditions.find((r) => r.id === id);
  if (found) {
    return `MP4 Rendition (${found.resolution || found.name || id})`;
  }
  return id;
}

const Sidebar: FC<SidebarProps> = ({ sdk }) => {
  const [pendingActionsList, setPendingActionsList] = useState<
    { fieldId: string; pendingActions: any; entryValue: any }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let detachFns: (() => void)[] = [];
    const fields = sdk.entry.fields;
    const fieldIds = Object.keys(fields);

    const updatePendingActions = async () => {
      const results: { fieldId: string; pendingActions: any; entryValue: any }[] = [];
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

  function renderPendingAction(action: any, entryValue: any) {
    switch (action.type) {
      case 'caption': {
        const name = getCaptionNameById(entryValue.captions, action.id);
        if (action.id && action.id.startsWith('auto-')) {
          return `Auto-generated caption will be created (${
            action.data?.languageCode || action.id
          })`;
        }
        if (action.id && action.id.startsWith('new-')) {
          return `New caption will be created (${action.data?.languageCode || action.id})`;
        }
        if (action.id) {
          return `${name} will be removed`;
        }
        return 'Caption change pending';
      }
      case 'staticRendition': {
        const name = getRenditionNameById(entryValue.static_renditions, action.id);
        if (action.id) {
          return `${name} will be removed`;
        }
        return 'MP4 Rendition change pending';
      }
      case 'asset': {
        return 'The entire asset will be removed from Mux';
      }
      case 'playback': {
        if (action.data?.policy === 'signed') {
          return 'A signed playback ID will be created';
        } else if (action.data?.policy === 'public') {
          return 'A public playback ID will be created';
        } else if (action.id) {
          return `Playback ID ${action.id} will be removed`;
        }
        return 'Playback change pending';
      }
      default:
        return `Pending action: ${action.type}`;
    }
  }

  function getPlaybackSwitchText(pendingActions: any) {
    const createPlayback = (pendingActions.create || []).find((a: any) => a.type === 'playback');
    const deletePlayback = (pendingActions.delete || []).find((a: any) => a.type === 'playback');
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
                  {pendingActions.delete.map((action: any, idx: number) =>
                    playbackSwitchText && action.type === 'playback' ? null : (
                      <ListItem key={`delete-${idx}`}>
                        {renderPendingAction(action, entryValue)}
                      </ListItem>
                    )
                  )}
                </>
              )}
              {pendingActions.create && pendingActions.create.length > 0 && (
                <>
                  {pendingActions.create.map((action: any, idx: number) =>
                    playbackSwitchText && action.type === 'playback' ? null : (
                      <ListItem key={`create-${idx}`}>
                        {renderPendingAction(action, entryValue)}
                      </ListItem>
                    )
                  )}
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
