import React from 'react';
import { Heading, Paragraph, Button } from '@contentful/f36-components';

const JiraStep = () => (
  <div className="section">
    <>
      <Heading>Get Jira companion app</Heading>
      <Paragraph>
        The companion app must be installed in your Jira instance in order for Contentful to link to
        Jira issues.
      </Paragraph>
      <Paragraph>
        <Button
          isFullWidth
          onClick={() => window.open('https://marketplace.atlassian.com/apps/1221865/', '_blank')}>
          Get companion app for Jira Cloud
        </Button>
        <br />
      </Paragraph>
    </>
  </div>
);

export default JiraStep;
