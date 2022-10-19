import React from 'react';

import { Button, Heading, Paragraph } from '@contentful/f36-components';

const JiraStep = () => (
  <div className="section">
    <React.Fragment>
      <Heading>Get Jira companion app</Heading>
      <Paragraph>
        The companion app must be installed in your Jira instance in order for Contentful to link to
        Jira issues.
      </Paragraph>
      <Paragraph>
        <Button
          variant="primary"
          onClick={() => window.open('https://marketplace.atlassian.com/apps/1221865/', '_blank')}
        >
          Get companion app for Jira Cloud
        </Button>
        <br />
      </Paragraph>
    </React.Fragment>
  </div>
);

export default JiraStep;
