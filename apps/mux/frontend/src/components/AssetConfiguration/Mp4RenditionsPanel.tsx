import { FC } from 'react';
import Mp4RenditionsList from '../Mp4RenditionsList';
import { Box } from '@contentful/f36-components';
import { MuxContentfulObject, StaticRendition, ResolutionType } from '../../util/types';

interface RenditionInfo {
  status: 'ready' | 'in_progress' | 'none' | 'skipped';
  url?: string;
  id?: string;
}

interface Mp4RenditionsPanelProps {
  asset: MuxContentfulObject;
  onCreateRendition: (type: ResolutionType) => Promise<void>;
  onDeleteRendition: (id: string) => void;
  onUndoDeleteRendition: (id: string) => void;
  isRenditionPendingDelete: (id: string) => boolean;
}

const mapRendition = (
  files: Array<StaticRendition> | undefined,
  type: ResolutionType,
  baseStaticRenditionURL: string
): RenditionInfo => {
  const file = files?.find((f) => f.resolution === type);
  let response: RenditionInfo = { status: 'none' };

  if (file) {
    if (file.status === 'ready')
      response = { status: 'ready', url: `${baseStaticRenditionURL}/${file.name}`, id: file.id };
    else if (file.status === 'preparing') response = { status: 'in_progress', id: file.id };
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
  const baseStaticRenditionURL = `https://stream.mux.com/${
    asset.playbackId ?? asset.signedPlaybackId
  }`;
  const files = asset?.static_renditions || [];
  const highest = mapRendition(files, 'highest', baseStaticRenditionURL);
  const audioOnly = mapRendition(files, 'audio-only', baseStaticRenditionURL);

  return (
    <Box>
      <Mp4RenditionsList
        highest={highest}
        audioOnly={audioOnly}
        onCreateRendition={onCreateRendition}
        onDeleteRendition={onDeleteRendition}
        onUndoDeleteRendition={onUndoDeleteRendition}
        isRenditionPendingDelete={isRenditionPendingDelete}
      />
    </Box>
  );
};

export default Mp4RenditionsPanel;
