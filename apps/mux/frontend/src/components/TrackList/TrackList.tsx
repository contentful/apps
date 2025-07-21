import React from 'react';
import { Note, Box, Table, Button, Tooltip, TextLink } from '@contentful/f36-components';
import { Track, AudioTrack, CaptionTrack } from '../../util/types';
import DeleteUndoButton from '../DeleteUndoButton';

interface TrackListProps {
  tracks: Track[];
  onDeleteTrack: (trackId: string) => void;
  onUndoDeleteTrack: (trackId: string) => void;
  isTrackPendingDelete: (trackId: string) => boolean;
  playbackId?: string;
  domain?: string;
  token?: string;
  type: 'caption' | 'audio';
  isSigned?: boolean;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  onDeleteTrack,
  onUndoDeleteTrack,
  isTrackPendingDelete,
  type,
  playbackId,
  domain,
  token,
  isSigned,
}) => {
  if (!tracks || tracks.length === 0) {
    return (
      <Box marginTop="spacingL" marginBottom="spacingL">
        <Note variant="neutral">No {type === 'caption' ? 'Captions' : 'Audios'}</Note>
      </Box>
    );
  }

  const getDownloadUrl = (track: Track, format: 'vtt' | 'txt' = 'vtt'): string | undefined => {
    if (type === 'caption' && track.type === 'text' && playbackId) {
      const baseUrl = `https://${domain || 'stream.mux.com'}/${playbackId}/text/${
        track.id
      }.${format}`;
      return isSigned && token ? `${baseUrl}?token=${token}` : baseUrl;
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
              {type === 'caption' && (
                <>
                  <Table.Cell>VTT File</Table.Cell>
                  <Table.Cell>Transcript (.txt)</Table.Cell>
                </>
              )}
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
                <Table.Cell>{track.status ?? 'ready'}</Table.Cell>
                {type === 'caption' && (
                  <>
                    <Table.Cell>
                      {track.type === 'text' && track.status === 'ready' && (
                        <TextLink
                          href={getDownloadUrl(track, 'vtt')}
                          target="_blank"
                          rel="noopener noreferrer">
                          Download
                        </TextLink>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {track.type === 'text' &&
                        track.status === 'ready' &&
                        (track.text_source === 'generated_vod' ? (
                          <TextLink
                            href={getDownloadUrl(track, 'txt')}
                            target="_blank"
                            rel="noopener noreferrer">
                            Download
                          </TextLink>
                        ) : (
                          <Tooltip
                            content="Transcripts can only be downloaded for auto-generated captions"
                            placement="top">
                            <TextLink isDisabled href="#" onClick={(e) => e.preventDefault()}>
                              Download
                            </TextLink>
                          </Tooltip>
                        ))}
                    </Table.Cell>
                  </>
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
                    <DeleteUndoButton
                      isPendingDelete={isTrackPendingDelete(track.id)}
                      onDelete={() => onDeleteTrack(track.id)}
                      onUndo={() => onUndoDeleteTrack(track.id)}
                    />
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
