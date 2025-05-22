import React, { Component, ChangeEvent } from 'react';
import { ConfigAppSDK, OnConfigureHandlerReturn } from '@contentful/app-sdk';
import {
  Card,
  Form,
  FormControl,
  TextLink,
  Paragraph,
  Note,
  Tabs,
  TextInput,
} from '@contentful/f36-components';
import logoUrl from '../assets/logo.png';
import sidebarScreenshotUrl from '../assets/sidebar.png';

export interface AppInstallationParameters {
  cpaToken: string;
}

type ParameterKeys = keyof AppInstallationParameters;

interface ConfigProps {
  sdk: ConfigAppSDK;
}

interface ConfigState {
  currentTab: string;
  parameters: AppInstallationParameters;
}

const TABS = [
  {
    id: 'configuration',
    label: 'Configuration',
    render: ({
      sdk,
      state,
      onInputChange,
    }: {
      sdk: ConfigAppSDK;
      state: ConfigState;
      onInputChange: (event: ChangeEvent) => void;
    }) => (
      <>
        <Paragraph>
          The GraphiQL Playground app enabled developers and content creators to write GraphiQL
          queries right next to their content.
        </Paragraph>
        <Form>
          <Paragraph style={{ marginTop: '1em' }}>
            <TextLink
              href={`https://${sdk.hostnames.webapp}/spaces/${sdk.ids.space}/api/keys`}
              target="_blank"
              rel="noopener">
              Create a new pair of API keys
            </TextLink>{' '}
            and save the Content Preview API token below:
          </Paragraph>
          <FormControl id="cpaToken">
            <FormControl.Label>CPA token</FormControl.Label>
            <TextInput
              name="cpaToken"
              id="cpaToken"
              isRequired
              value={state.parameters.cpaToken}
              onChange={onInputChange}
            />
          </FormControl>
          <Note>
            The CPA (Content Preview API) token allows you to also access preview data when using
            GraphiQL playground.
          </Note>
        </Form>
      </>
    ),
  },
  {
    id: 'sidebar-config',
    label: 'Sidebar',
    render: () => (
      <>
        <Paragraph>
          To enable GraphiQL playground in the content entry sidebar head over to the content model
          section and select the GraphiQL Playground widget. It will be available only if you
          configure and install the application correctly.
        </Paragraph>
        <img
          src={sidebarScreenshotUrl}
          alt="Screenshot of the sidebar configuration of a content type"
        />
        <Note style={{ marginTop: '1em' }}>
          You can learn more about the sidebar location{' '}
          <TextLink
            href="https://www.contentful.com/developers/docs/extensibility/app-framework/locations/#entry-sidebar"
            target="blank"
            rel="noopener">
            in the documentation
          </TextLink>
          .
        </Note>
      </>
    ),
  },
  {
    id: 'feedback',
    label: 'Feedback',
    render: () => (
      <>
        <Paragraph>
          If you have any feedback don't hesitate to{' '}
          <TextLink href="https://github.com/contentful/apps" target="_blank" rel="noopener">
            open an issue on GitHub
          </TextLink>
          . We're open for contributions, too. 🙈
        </Paragraph>
      </>
    ),
  },
];

export default class Config extends Component<ConfigProps, ConfigState> {
  sdk: ConfigAppSDK;

  constructor(props: ConfigProps) {
    super(props);
    this.state = { currentTab: 'configuration', parameters: { cpaToken: '' } };
    this.sdk = props.sdk;

    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    props.sdk.app.onConfigure(() => this.onConfigure() as Promise<OnConfigureHandlerReturn>);
  }

  async componentDidMount() {
    // Get current parameters of the app.
    // If the app is not installed yet, `parameters` will be `null`.
    const parameters: AppInstallationParameters | null = await this.props.sdk.app.getParameters();

    this.setState(parameters ? { ...this.state, parameters } : this.state, () => {
      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      this.props.sdk.app.setReady();
    });
  }

  // save and install
  onConfigure = async () => {
    try {
      const currentAppState = await this.sdk.app.getCurrentState();

      console.log(currentAppState);

      if (!this.state.parameters.cpaToken) {
        this.sdk.notifier.error('Please define the Content Preview API token.');
        return false;
      }

      return {
        parameters: this.state.parameters,
        targetState: {
          EditorInterface: {
            ...(currentAppState ? currentAppState.EditorInterface : {}),
          },
        },
      };
    } catch (error) {
      console.error(error);
    }
  };

  onInputChange = (event: ChangeEvent): void => {
    const target = event.target as HTMLInputElement;
    const { name, value } = target;

    this.setState({
      parameters: {
        [name as ParameterKeys]: value,
      },
    });
  };

  render() {
    const { currentTab } = this.state;

    return (
      <Card style={{ maxWidth: '38em', margin: '3em auto' }}>
        <img
          src={logoUrl}
          alt="GraphlQL Playground Logo"
          style={{ height: '5em', display: 'block' }}
        />
        <Tabs currentTab={currentTab} onTabChange={(id) => this.setState({ currentTab: id })}>
          <Tabs.List>
            {TABS.map(({ id, label }) => (
              <Tabs.Tab panelId={id} key={id}>
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {TABS.map(({ id, render }) => (
          <div
            key={id}
            style={{
              display: id === currentTab ? 'block' : 'none',
              padding: '1em',
            }}>
            {render({
              sdk: this.sdk,
              state: this.state,
              onInputChange: this.onInputChange,
            })}
          </div>
        ))}
      </Card>
    );
  }
}
