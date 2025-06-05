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
    <Box marginTop="spacingL" marginBottom="spacingL">
      <Table data-testid="track_table">
        <Table.Head>
          <Table.Row>
            <Table.Cell>Name</Table.Cell>
            <Table.Cell>Language Code</Table.Cell>
            {type === 'caption' && <Table.Cell>Closed Captions</Table.Cell>}
            {type === 'audio' && <Table.Cell>Primary</Table.Cell>}
            <Table.Cell>Status</Table.Cell>
            <Table.Cell>Actions</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {tracks.map((track) => {
            const isAudio = track.type === 'audio';
            const audioTrack = isAudio ? (track as AudioTrack) : null;
            const captionTrack = !isAudio ? (track as CaptionTrack) : null;

            return (
              <Table.Row key={track.id}>
                <Table.Cell>
                  {track.name || 'Default'}
                  {captionTrack?.text_source?.includes('generated') ? ' (Auto)' : ''}
                  {captionTrack?.text_source?.includes('final') ? ' (Final)' : ''}
                </Table.Cell>
                <Table.Cell>{track.language_code || '-'}</Table.Cell>
                {type === 'caption' && captionTrack && (
                  <Table.Cell>{captionTrack.closed_captions ? 'Yes' : 'No'}</Table.Cell>
                )}
                {type === 'audio' && audioTrack && (
                  <Table.Cell>{audioTrack.primary ? 'Yes' : 'No'}</Table.Cell>
                )}
                <Table.Cell>{track.status === 'preparing' ? 'Preparing' : 'Ready'}</Table.Cell>
                <Table.Cell>
                  {type === 'audio' && audioTrack?.primary ? (
                    <Tooltip placement="top" content="Cannot delete the primary audio track">
                      <Button variant="negative" size="small" data-track={track.id} isDisabled>
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
            );
          })}
        </Table.Body>
      </Table>
    </Box>
  );
};

export default TrackList;
