/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from 'react';
import get from 'lodash.get';
import JiraClient from '../../jiraClient';
import InstanceStep from './Steps/InstanceStep';
import ContentTypeStep from './Steps/ContentTypeStep';
import JiraStep from './Steps/JiraStep';
import { AppExtensionSDK, CollectionResponse, EditorInterface } from 'contentful-ui-extensions-sdk';

interface Props {
  token: string;
  sdk: AppExtensionSDK;
  reauth: () => void;
}

interface State {
  resources: JiraCloudResource[];
  projects: CloudProject[];
  contentTypes: { name: string; id: string }[];
  checkedResource: string;
  checkedProject: CloudProject | null;
  selectedContentTypes: string[];
}

export default class Config extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      resources: [],
      projects: [],
      contentTypes: [],
      checkedResource: '',
      checkedProject: null,
      selectedContentTypes: []
    };
  }

  async componentDidMount() {
    const { app } = this.props.sdk;

    const [config] = await Promise.all([
      app.getParameters() as Promise<InstallationParameters | null>,
      this.getCloudAccounts(),
      this.loadContentTypes(),
      this.loadEditorInterfaces()
    ]);

    app.onConfigure(this.configure);

    if (config) {
      const { resourceId = '', projectId = '' } = config;

      const configResourceExistsInResources = !!this.state.resources.find(r => r.id === resourceId);
      const { project } = await JiraClient.getProjectById(resourceId, this.props.token, projectId);


      // only use the saved config if the resource exists
      // we can assume the projectId is also invalid if it doesn't exist
      if (configResourceExistsInResources) {
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState({
          checkedResource: resourceId,
          checkedProject: project
        });
      }

      app.setReady();
    } else {
      app.setReady();
    }
  }

  configure = () => {
    const { checkedResource, checkedProject, selectedContentTypes } = this.state;

    if (!checkedResource) {
      this.props.sdk.notifier.error('You must select a Jira instance to continue!');

      return false;
    }

    if (!checkedProject) {
      this.props.sdk.notifier.error('You must select a Jira project to continue!');

      return false;
    }

    return {
      parameters: {
        projectId: checkedProject.id,
        resourceId: checkedResource,
        resourceUrl: this.state.resources.find(r => r.id === checkedResource)!.url
      },
      targetState: {
        EditorInterface: selectedContentTypes.reduce(
          (acc, ct) => ({
            ...acc,
            ...{ [ct]: { sidebar: { position: 1 } } }
          }),
          {}
        )
      }
    };
  };

  loadContentTypes = async () => {
    const data = (await this.props.sdk.space.getContentTypes()) as CollectionResponse<{
      name: string;
      sys: { id: string };
    }>;
    if (data.items.length) {
      this.setState({
        contentTypes: data.items.map(i => ({ name: i.name, id: i.sys.id }))
      });
    }
  };

  loadEditorInterfaces = async () => {
    const { space, ids } = this.props.sdk;
    const eisResponse = (await space.getEditorInterfaces()) as CollectionResponse<EditorInterface>;

    const selectedContentTypes = eisResponse.items
      .filter(
        ei =>
          !!get(ei, ['sidebar'], []).find(item => {
            return item.widgetNamespace === 'app' && item.widgetId === ids.app;
          })
      )
      .map(ei => get(ei, ['sys', 'contentType', 'sys', 'id']))
      .filter(ctId => typeof ctId === 'string' && ctId.length > 0);

    this.setState({ selectedContentTypes });
  };

  getCloudAccounts = async () => {
    const res = await JiraClient.getCloudAccounts(this.props.token);

    if (!res.error) {
      this.setState({
        resources: res.resources,
        // if there is only one project, automatically check it
        checkedResource: res.resources.length === 1 ? res.resources[0].id : ''
      });
    } else {
      this.props.reauth();

      this.props.sdk.notifier.error(
        'There was a problem communicating with Jira. Please reauthenticate and try again.'
      );
    }
  };

  getProjects = async (query: string = '') => {
    const resource = this.state.resources.find(r => r.id === this.state.checkedResource);

    if (resource) {
      const data = await JiraClient.getProjects(resource.id, this.props.token, query);

      this.setState(() => ({
        projects: data.projects
      }));
    }
  };

  pickResource = (id: string) => {
    this.setState({ checkedResource: id });
  };

  pickProject = (project: CloudProject) => {
    this.setState({ checkedProject: project, projects: [] });
  };

  toggleCtSelection = (id: string) => {
    if (this.state.selectedContentTypes.includes(id)) {
      this.setState((prevState: State) => ({
        selectedContentTypes: prevState.selectedContentTypes.filter(ct => ct !== id)
      }));
    } else {
      this.setState((prevState: State) => ({
        selectedContentTypes: prevState.selectedContentTypes.concat(id)
      }));
    }
  };

  render() {
    return (
      <div className="configuration" data-test-id="configuration">
        <InstanceStep
          pickResource={this.pickResource}
          resources={this.state.resources}
          selectedResource={this.state.checkedResource}
          queryProjects={this.getProjects}
          pickProject={this.pickProject}
          projects={this.state.projects}
          selectedProject={this.state.checkedProject}
        />
        <JiraStep />
        <ContentTypeStep
          contentTypes={this.state.contentTypes}
          selectCt={this.toggleCtSelection}
          selectedContentTypes={this.state.selectedContentTypes}
        />
      </div>
    );
  }
}
