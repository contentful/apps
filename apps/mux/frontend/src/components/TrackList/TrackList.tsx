import React from 'react';
import { Note, Box, Table, Button, Tooltip, TextLink } from '@contentful/f36-components';
import { Track, AudioTrack, CaptionTrack } from '../../util/types';

interface TrackListProps {
  tracks: Track[];
  onDeleteTrack: (e: React.MouseEvent<HTMLButtonElement>) => void;
  playbackId?: string;
  domain?: string;
  token?: string;
  type: 'caption' | 'audio';
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  onDeleteTrack,
  type,
  playbackId,
  domain,
}) => {
  if (!tracks || tracks.length === 0) {
    return (
      <Box marginTop="spacingL" marginBottom="spacingL">
        <Note variant="neutral">No {type === 'caption' ? 'Captions' : 'Audio Tracks'}</Note>
      </Box>
    );
  }

  const getDownloadUrl = (track: Track): string | undefined => {
    if (type === 'caption' && track.type === 'text' && playbackId) {
      return `https://${domain || 'stream.mux.com'}/${playbackId}/text/${track.id}.vtt`;
    }
    return undefined;
  };

  return (
    <Box marginBottom="spacingM">
      {tracks.length > 0 && (
        <Table data-testid={type === 'caption' ? 'caption_table' : 'audio_table'}>
          <Table.Head>
            <Table.Row>
              <Table.Cell>Name</Table.Cell>
              <Table.Cell>Language</Table.Cell>
              {type === 'caption' && <Table.Cell>Closed Captions</Table.Cell>}
              <Table.Cell>Status</Table.Cell>
              {type === 'caption' && <Table.Cell>Download</Table.Cell>}
              <Table.Cell>Actions</Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {tracks.map((track) => (
              <Table.Row key={track.id}>
                <Table.Cell>{track.name || '-'}</Table.Cell>
                <Table.Cell>{track.language_code || '-'}</Table.Cell>
                {type === 'caption' && (
                  <Table.Cell>
                    {track.type === 'text' && (track as CaptionTrack).closed_captions
                      ? 'Yes'
                      : 'No'}
                  </Table.Cell>
                )}
                <Table.Cell>{track.status}</Table.Cell>
                {type === 'caption' && (
                  <Table.Cell>
                    {track.type === 'text' && track.status === 'ready' && (
                      <TextLink
                        href={getDownloadUrl(track)}
                        target="_blank"
                        rel="noopener noreferrer">
                        Download
                      </TextLink>
                    )}
                  </Table.Cell>
                )}
                <Table.Cell>
                  {type === 'audio' && (track as AudioTrack).primary ? (
                    <Tooltip content="Cannot delete the primary audio track">
                      <Button
                        variant="negative"
                        size="small"
                        isDisabled={true}
                        data-track={track.id}>
                        Delete
                      </Button>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="negative"
                      size="small"
                      data-track={track.id}
                      onClick={onDeleteTrack}>
                      Delete
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Box>
  );
};

export default TrackList;
