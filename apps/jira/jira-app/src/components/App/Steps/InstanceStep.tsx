import React from 'react';
import { Heading, Paragraph, Select, Option, Autocomplete } from '@contentful/f36-components';
import { JiraCloudResource, CloudProject } from '../../../interfaces';

interface Props {
  resources: JiraCloudResource[];
  selectedResource: string;
  pickResource: (id: string) => void;
  projects: CloudProject[];
  pickProject: (project: CloudProject) => void;
  selectedProject: CloudProject | null;
  queryProjects: (query: string) => void;
}

export default class InstanceStep extends React.Component<Props> {
  componentDidMount() {
    this.setInputTestId();
  }

  componentDidUpdate() {
    this.setInputTestId();
  }

  setInputTestId() {
    // Forma 36 Autocomplete renders an input inside the component
    // We find it and set the data-test-id for the test
    const el = document.querySelector('.project-autocomplete input');
    if (el) {
      el.setAttribute('data-test-id', 'cf-ui-text-input');
    }
  }

  render() {
    const { resources, pickResource, selectedResource, projects, selectedProject } = this.props;

    return (
      <>
        <Heading>Configure</Heading>
        <Paragraph>Select the Jira site and project you want to connect</Paragraph>
        <div className="jira-config" data-test-id="instance-step">
          <div className="jira-config-row">
            <Select
              testId="instance-selector"
              className="selector"
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => pickResource(e.target.value)}
              isDisabled={resources.length === 1}
              value={selectedResource || ''}>
              <Option value="">Select a site</Option>
              {resources.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.url.replace('https://', '')}
                </Option>
              ))}
            </Select>

            <Autocomplete<CloudProject>
              items={projects}
              itemToString={(item) => (item ? item.name : '')}
              testId="project-autocomplete"
              noMatchesMessage="No projects found"
              onSelectItem={(item) => {
                if (item) this.props.pickProject(item);
              }}
              selectedItem={selectedProject || undefined}
              onInputValueChange={(inputValue) => {
                this.props.queryProjects(inputValue || '');
              }}
              renderItem={(item: CloudProject, inputValue: string) => {
                const isSelected = selectedProject && selectedProject.id === item.id;
                return (
                  <div
                    data-test-id="search-result-project"
                    className={`autocomplete-item${isSelected ? ' selected' : ''}`}>
                    {item.name}
                  </div>
                );
              }}
              className="project-autocomplete"
            />
          </div>
        </div>
      </>
    );
  }
}
