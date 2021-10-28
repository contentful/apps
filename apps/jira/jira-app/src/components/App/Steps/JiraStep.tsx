import React from 'react';
import { Typography, Heading, Paragraph, Button } from '@contentful/forma-36-react-components';

const JiraStep = () => (
  <div className="section">
    <Typography>
      <Heading>Get Jira companion app</Heading>
      <Paragraph>
        The companion app must be installed in your Jira instance in order for Contentful to link to
        Jira issues.
      </Paragraph>
      <Paragraph>
        <Button
          onClick={() => window.open('https://marketplace.atlassian.com/apps/1221865/', '_blank')}
        >
          Get companion app for Jira Cloud
        </Button>
        <br />
      </Paragraph>
    </Typography>
  </div>
);

export default JiraStep;
