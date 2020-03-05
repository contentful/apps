import React from 'react';
import {
  Typography,
  Heading,
  Paragraph,
  Select,
  Option,
  TextInput,
  Card
} from '@contentful/forma-36-react-components';

// using lodash.debouce basically breaks test with infinite timers
const debounce = function(fn: Function, timeout: number): Function {
  let timer: any;

  return function(...args: any[]) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, timeout);
  }
}

interface State {
  inputValue: string
}

interface Props {
  resources: JiraCloudResource[];
  selectedResource: string;
  pickResource: (id: string) => void;
  projects: CloudProject[];
  pickProject: (project: CloudProject) => void;
  selectedProject: CloudProject | null;
  queryProjects: (query: string)=>void;
}

export default class InstanceStep extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      inputValue: ''
    }
  }

  handleInputChange = debounce((ev: any) => {
    this.setState({
      inputValue: ev.target.value
    });

    this.props.queryProjects(ev.target.value);
  }, 300)

  selectProject = (project: CloudProject) => {
    this.setState({
      inputValue: ''
    });

    this.props.pickProject(project)
  }

  render () {
    const {
      resources,
      pickResource,
      selectedResource,
      projects,
      selectedProject
    } = this.props;

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

          <div className="search-projects">
            <TextInput
              width="full"
              placeholder={selectedProject ? selectedProject.name : "Search for a project"}
              value={ this.state.inputValue }
              onChange={ev => { ev.persist(); this.handleInputChange(ev) }}
              onFocus={() => {this.setState({inputValue: ''})}}
            />
            <div className="search-projects-results">
              {
                projects.map(project => (
                  <Card
                    key={project.id}
                    testId="search-result-project"
                    onClick={() => {this.selectProject(project)}}
                  >
                    { project.name }
                  </Card>
                ))
              }
            </div>
          </div>
        </div>
      </Typography>
    );

  }
}
