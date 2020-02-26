import React from 'react';
import {
  Typography,
  Heading,
  Paragraph,
  Select,
  Option
} from '@contentful/forma-36-react-components';

interface Props {
  resources: JiraCloudResource[];
  selectedResource: string;
  pickResource: (id: string) => void;
  projects: CloudProject[];
  pickProject: (id: string) => void;
  selectedProject: string;
}

const InstanceStep = ({
  resources,
  pickResource,
  selectedResource,
  projects = [],
  pickProject,
  selectedProject
}: Props) => {
  return (
    <Typography>
      <Heading>Configure</Heading>
      <Paragraph>Select the Jira site and project you want to connect</Paragraph>
      <div className="jira-config" data-test-id="instance-step">
        <Select
          data-test-id="instance-selector"
          className="selector"
          // @ts-ignore: 2339
          onChange={e => pickResource(e.target.value)}
          isDisabled={resources.length === 1}
          width="full"
          value={selectedResource || ''}>
          <Option value="">Select a site</Option>
          {resources.map(r => (
            <Option key={r.id} value={r.id}>
              {r.url.replace('https://', '')}
            </Option>
          ))}
        </Select>
        <Select
          data-test-id="project-selector"
          className={`selector ${!projects.length ? 'disabled' : ''}`}
          // @ts-ignore: 2339
          onChange={e => pickProject(e.target.value)}
          isDisabled={projects.length < 2}
          width="full"
          value={selectedProject || ''}>
          <Option value="">Pick a project</Option>
          {projects.map(p => (
            <Option key={p.id} value={p.id}>
              {p.name}
            </Option>
          ))}
        </Select>
      </div>
    </Typography>
  );
};

export default InstanceStep;
