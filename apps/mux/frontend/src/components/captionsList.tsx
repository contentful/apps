import * as React from 'react';

import { Button, Table } from '@contentful/f36-components';
import { type captionListProps } from '../util/types';

class CaptionsList extends React.Component<captionListProps, {}> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  token = () => {
    return this.props.token ? `?token=${this.props.token}` : '';
  };

  render() {
    return (
      <div>
        <Table data-testid="caption_table">
          <Table.Head>
            <Table.Row>
              <Table.Cell>Name</Table.Cell>
              <Table.Cell>Lang Code</Table.Cell>
              <Table.Cell>Closed Captions</Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {this.props.captions.map((caption) => {
              return (
                <Table.Row key={caption.id}>
                  <Table.Cell>
                    {caption.name} {caption.text_source?.includes('generated') ? 'Auto' : ''}{' '}
                    {caption.text_source?.includes('final') ? 'Final' : ''}{' '}
                    {caption.status === 'preparing' ? '(preparing)' : ''}
                  </Table.Cell>
                  <Table.Cell>{caption.language_code}</Table.Cell>
                  <Table.Cell>{caption.closed_captions ? 'Yes' : 'No'}</Table.Cell>
                  <Table.Cell>
                    <a
                      href={`https://stream.${this.props.domain}/${this.props.playbackId}/text/${
                        caption.id
                      }.vtt${this.token()}`}>
                      Download
                    </a>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="negative"
                      size="small"
                      data-track={caption.id}
                      onClick={this.props.requestDeleteCaption}>
                      Delete
                    </Button>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </div>
    );
  }
}

export default CaptionsList;
