import { FC } from 'react';
import { Box, Table, Button, TextLink, Note, Spinner } from '@contentful/f36-components';

interface RenditionInfo {
  status: 'ready' | 'in_progress' | 'none';
  url?: string;
  id?: string;
}

export interface Mp4RenditionsListProps {
  highest: RenditionInfo;
  audioOnly: RenditionInfo;
  onCreateRendition: (type: 'highest' | 'audio-only') => void;
  onDeleteRendition: (id: string) => void;
}

const statusLabel = {
  ready: 'Ready',
  in_progress: 'In progress',
  none: 'Not created',
};

const Mp4RenditionsList: FC<Mp4RenditionsListProps> = ({
  highest,
  audioOnly,
  onCreateRendition,
  onDeleteRendition,
}) => {
  const rows = [
    { label: 'Highest Resolution', key: 'highest', data: highest },
    { label: 'Audio Only', key: 'audio-only', data: audioOnly },
  ];
  return (
    <Box marginTop="spacingL" marginBottom="spacingL">
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
                {rendition.data.status === 'in_progress' && <Spinner size="small" />}{' '}
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
                    onClick={() => onCreateRendition(rendition.key as 'highest' | 'audio-only')}>
                    Create
                  </Button>
                )}
                {rendition.data.status === 'ready' && rendition.data.id && (
                  <Button
                    size="small"
                    variant="negative"
                    onClick={() => onDeleteRendition(rendition.data.id as string)}>
                    Delete
                  </Button>
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
    </Box>
  );
};

export default Mp4RenditionsList;
