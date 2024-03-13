import * as React from 'react';
import { Textarea, CopyButton, TextLink, Box } from '@contentful/f36-components';

interface GetPlayerCodeProps {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  params: any;
}

class PlayerCode extends React.Component<GetPlayerCodeProps, {}> {
  createParams = () => {
    let html = '';
    this.props.params.forEach((element) => {
      if (element.value) {
        html += `  ${element.name}="${element.value}"
    `;
      }
    });
    return html;
  };

  get codesnippet() {
    let html = ``;
    html += `<script src="https://unpkg.com/@mux/mux-player"></script>

<mux-player 
    `;
    html += this.createParams();
    html += `  style="width:100%"`;
    html += `
/>`;

    return html;
  }

  render() {
    return (
      <section>
        <Box marginTop="spacingM" marginBottom="spacingS">
          <Textarea value={this.codesnippet} isReadOnly={true} className="copycodearea" />
        </Box>
        <CopyButton
          value={this.codesnippet}
          tooltipCopiedText="Snippet Copied"
          tooltipText="Copy Player Snippet"
        />
        <p>
          <TextLink
            href="https://docs.mux.com/guides/video/mux-player"
            target="_blank"
            rel="noopener noreferrer">
            Read more about Mux Player
          </TextLink>
        </p>
      </section>
    );
  }
}

export default PlayerCode;
