import { FC } from 'react';
import Mp4RenditionsList from '../Mp4RenditionsList';
import {
  MuxContentfulObject,
  StaticRendition,
  ResolutionType,
  RenditionActionsProps,
} from '../../util/types';
import { RenditionInfo } from '../../util/types';

interface Mp4RenditionsPanelProps extends RenditionActionsProps {
  asset: MuxContentfulObject;
}

const mapRendition = (
  files: Array<StaticRendition> | undefined,
  type: ResolutionType,
  baseStaticRenditionURL: string | undefined
): RenditionInfo => {
  const file = files?.find((f) => f.resolution === type);
  let response: RenditionInfo = { status: 'none' };

  if (file) {
    if (file.status === 'ready')
      response = {
        status: 'ready',
        // No playback ID, no download URL. A rendition can outlive every playback ID on the asset
        // — a `moderate` directive deletes those and leaves the MP4s — and the list renders a "-"
        // for a missing URL, which is better than a link to `stream.mux.com/undefined`.
        url: baseStaticRenditionURL ? `${baseStaticRenditionURL}/${file.name}` : undefined,
        id: file.id,
      };
    else if (file.status === 'preparing') response = { status: 'inProgress', id: file.id };
    else if (file.status === 'skipped') response = { status: 'skipped', id: file.id };
    else response = { status: 'none', id: file.id };
  }
  return response;
};

const Mp4RenditionsPanel: FC<Mp4RenditionsPanelProps> = ({
  asset,
  onCreateRendition,
  onDeleteRendition,
  onUndoDeleteRendition,
  isRenditionPendingDelete,
}) => {
  const playbackId = asset.playbackId ?? asset.signedPlaybackId;
  const baseStaticRenditionURL = playbackId ? `https://stream.mux.com/${playbackId}` : undefined;
  const files = asset?.static_renditions || [];
  const highest = mapRendition(files, 'highest', baseStaticRenditionURL);
  const audioOnly = mapRendition(files, 'audio-only', baseStaticRenditionURL);

  return (
    <>
      <Mp4RenditionsList
        highest={highest}
        audioOnly={audioOnly}
        onCreateRendition={onCreateRendition}
        onDeleteRendition={onDeleteRendition}
        onUndoDeleteRendition={onUndoDeleteRendition}
        isRenditionPendingDelete={isRenditionPendingDelete}
      />
    </>
  );
};

export default Mp4RenditionsPanel;
