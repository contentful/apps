import React from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import {
  Heading,
  Paragraph,
  TextLink,
  Note,
  Flex,
  FormControl,
  TextInput,
  Checkbox,
} from '@contentful/f36-components';
import get from 'lodash.get';
// @ts-ignore 2307
import logo from './logo.svg';

interface Props {
  sdk: AppExtensionSDK;
}
interface ContentType {
  name: string;
  id: string;
}
interface State {
  contentTypes: ContentType[];
  selectedContentTypes: string[];
  projectId: string;
}

export default class AppConfig extends React.Component<Props, State> {
  state: State = {
    contentTypes: [],
    selectedContentTypes: [],
    projectId: '',
  };

  async componentDidMount() {
    const { sdk } = this.props;

    sdk.app.onConfigure(this.configure);

    const [ctsRes, parameters, eiRes] = await Promise.all([
      sdk.space.getContentTypes({ limit: 1000 }),
      sdk.app.getParameters() as Promise<SmartlingParameters | null>,
      sdk.space.getEditorInterfaces(),
    ]);

    const selectedContentTypes = eiRes.items
      .filter((ei) =>
        get(ei, ['sidebar'], []).some((item) => {
          return item.widgetNamespace === 'app' && item.widgetId === this.props.sdk.ids.app;
        })
      )
      .map((ei) => get(ei, ['sys', 'contentType', 'sys', 'id']))
      .filter((ctId) => typeof ctId === 'string' && ctId.length > 0);

    const items = ctsRes ? (ctsRes.items as { name: string; sys: { id: string } }[]) : [];

    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState(
      {
        contentTypes: items.map((ct) => ({ name: ct.name, id: ct.sys.id })),
        projectId: parameters ? parameters.projectId : '',
        selectedContentTypes,
      },
      () => sdk.app.setReady()
    );
  }

  configure = async () => {
    if (!this.state.projectId) {
      this.props.sdk.notifier.error('You must provide a project ID!');
      return false;
    }

    return {
      parameters: {
        projectId: this.state.projectId,
      },
      targetState: {
        EditorInterface: this.state.selectedContentTypes.reduce((acc: any, ct) => {
          acc[ct] = { sidebar: { position: 1 } };
          return acc;
        }, {}),
      },
    };
  };

  setProjectId(id: string) {
    this.setState({ projectId: id.trim() });
  }

  toggleCt(id: string) {
    this.setState((prevState: State) => {
      const { selectedContentTypes } = prevState;

      if (selectedContentTypes.includes(id)) {
        return {
          selectedContentTypes: selectedContentTypes.filter((ct) => ct !== id),
        };
      }

      return {
        selectedContentTypes: selectedContentTypes.concat([id]),
      };
    });
  }

  render() {
    const { sdk } = this.props;
    const {
      ids: { space, environment },
    } = sdk;
    return (
      <div className="app">
        <div className="background" />
        <div className="body">
          <div className="config">
            <div className="section">
              <>
                <Heading>About Smartling</Heading>
                <Paragraph className="about-p">
                  The{' '}
                  <TextLink
                    href="https://dashboard.smartling.com"
                    target="_blank"
                    rel="noopener noreferrer">
                    Smartling
                  </TextLink>{' '}
                  app allows you to view the status of your translation without leaving Contentful.
                </Paragraph>
              </>
              <hr />
            </div>
            <div className="section">
              <>
                <Heading>Configuration</Heading>
              </>
              <FormControl>
                <FormControl.Label>Smartling project ID</FormControl.Label>
                <TextInput
                  isRequired
                  testId="projectId"
                  name="projectId"
                  id="projectId"
                  className="project-id"
                  value={this.state.projectId}
                  onChange={(e) => this.setProjectId(e.target.value)}
                />
                <FormControl.HelpText>
                  To get the project ID, see the 'Project Settings API' of your Smartling project.
                </FormControl.HelpText>
              </FormControl>
              <>
                <Heading>Assign to content types</Heading>
                <Paragraph>Select which content types to use with Smartling.</Paragraph>
              </>
              {this.state.contentTypes.length === 0 ? (
                <Note variant="warning">
                  There are <strong>no content types</strong> in this environment. You can add one{' '}
                  <TextLink
                    variant="primary"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={
                      environment === 'master'
                        ? `https://${sdk.hostnames.webapp}/spaces/${space}/content_types`
                        : `https://${sdk.hostnames.webapp}/spaces/${space}/environments/${environment}/content_types`
                    }>
                    content type
                  </TextLink>{' '}
                  and assign it to the app from this screen.
                </Note>
              ) : (
                <Flex>
                  {this.state.contentTypes.map((ct) => (
                    <FormControl key={ct.id}>
                      <FormControl.Label>{ct.name}</FormControl.Label>
                      <Checkbox
                        onChange={() => this.toggleCt(ct.id)}
                        name={ct.name}
                        isChecked={this.state.selectedContentTypes.includes(ct.id)}
                        value={ct.id}
                        id={ct.name}
                        data-test-id={`ct-item-${ct.id}`}
                      />
                    </FormControl>
                  ))}
                </Flex>
              )}
            </div>
          </div>
        </div>
        <div className="logo">
          <img src={logo} alt="" />
        </div>
      </div>
    );
  }
}
