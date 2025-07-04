import { FC } from 'react';
import { Table, Button, TextLink, Note, Spinner, Tooltip } from '@contentful/f36-components';
import DeleteUndoButton from './DeleteUndoButton';
import { RenditionActionsProps, RenditionInfo, ResolutionType } from '../util/types';

interface Mp4RenditionsListProps extends RenditionActionsProps {
  highest: RenditionInfo;
  audioOnly: RenditionInfo;
}

const statusLabel = {
  ready: 'Ready',
  inProgress: 'In progress',
  none: 'Not created',
  skipped: 'Not available',
};

const Mp4RenditionsList: FC<Mp4RenditionsListProps> = ({
  highest,
  audioOnly,
  onCreateRendition,
  onDeleteRendition,
  onUndoDeleteRendition,
  isRenditionPendingDelete,
}) => {
  const rows = [
    { label: 'Highest Resolution', key: 'highest', data: highest },
    { label: 'Audio Only', key: 'audio-only', data: audioOnly },
  ];
  return (
    <>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Type</Table.Cell>
            <Table.Cell>Status</Table.Cell>
            <Table.Cell>Download</Table.Cell>
            <Table.Cell>Action</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {rows.map((rendition) => (
            <Table.Row key={rendition.key}>
              <Table.Cell>{rendition.label}</Table.Cell>
              <Table.Cell>
                {rendition.data.status === 'inProgress' && <Spinner size="small" />}{' '}
                {statusLabel[rendition.data.status]}
              </Table.Cell>
              <Table.Cell>
                {rendition.data.url ? (
                  <TextLink href={rendition.data.url} target="_blank" rel="noopener noreferrer">
                    Download
                  </TextLink>
                ) : (
                  <span>-</span>
                )}
              </Table.Cell>
              <Table.Cell>
                {rendition.data.status === 'none' && (
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => onCreateRendition(rendition.key as ResolutionType)}>
                    Create
                  </Button>
                )}
                {rendition.data.status === 'skipped' && (
                  <Tooltip content="This rendition cannot be created because it conflicts with the asset's content type (e.g., trying to create a video rendition for an audio-only asset)">
                    <Button size="small" variant="secondary" isDisabled>
                      Create
                    </Button>
                  </Tooltip>
                )}
                {rendition.data.status === 'ready' && rendition.data.id && (
                  <DeleteUndoButton
                    isPendingDelete={isRenditionPendingDelete(rendition.data.id)}
                    onDelete={() => onDeleteRendition(rendition.data.id as string)}
                    onUndo={() => onUndoDeleteRendition(rendition.data.id as string)}
                  />
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Note variant="neutral">
        MP4 renditions allow you to download your video in different formats. If a rendition is not
        available, click "Create" to generate it.
      </Note>
    </>
  );
};

export default Mp4RenditionsList;
