import React from 'react';
import { Note, Box, Table, Button, Tooltip } from '@contentful/f36-components';
import { Track, AudioTrack, CaptionTrack } from '../../util/types';

interface TrackListProps {
  tracks: Track[];
  onDeleteTrack: (e: React.MouseEvent<HTMLButtonElement>) => void;
  playbackId?: string;
  domain?: string;
  token?: string;
  type: 'caption' | 'audio';
}

const TrackList: React.FC<TrackListProps> = ({ tracks, onDeleteTrack, type }) => {
  if (!tracks || tracks.length === 0) {
    return (
      <Box marginTop="spacingL" marginBottom="spacingL">
        <Note variant="neutral">No {type === 'caption' ? 'Captions' : 'Audio Tracks'}</Note>
      </Box>
    );
  }

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
