import React, { Component, ChangeEvent } from "react";
import { AppExtensionSDK } from "contentful-ui-extensions-sdk";
import {
  Card,
  TextField,
  Form,
  TextLink,
  Paragraph,
  Note,
  Tabs,
  Tab,
} from "@contentful/forma-36-react-components";
import logoUrl from "../assets/logo.png";
import sidebarScreenshotUrl from "../assets/sidebar.png";

export interface AppInstallationParameters {
  cpaToken: string;
}

type ParameterKeys = keyof AppInstallationParameters;

interface ConfigProps {
  sdk: AppExtensionSDK;
}

interface ConfigState {
  currentTab: string;
  parameters: AppInstallationParameters;
}

const TABS = [
  {
    id: "configuration",
    label: "Configuration",
    render: ({
      sdk,
      state,
      onInputChange,
    }: {
      sdk: AppExtensionSDK;
      state: ConfigState;
      onInputChange: (event: ChangeEvent) => void;
    }) => (
      <>
        <Paragraph>
          The GraphQL Playground app enabled developers and content creators to
          write GraphQL queries right next to their content.
        </Paragraph>
        <Form>
          <Paragraph style={{ marginTop: "1em" }}>
            <TextLink
              href={`https://app.contentful.com/spaces/${sdk.ids.space}/api/keys`}
              target="_blank"
              rel="noopener"
            >
              Create a new pair of API keys
            </TextLink>{" "}
            and save the Content Preview API token below:
          </Paragraph>
          <TextField
            name="cpaToken"
            id="cpaToken"
            labelText="CPA token"
            required
            value={state.parameters.cpaToken}
            onChange={onInputChange}
          />
          <Note>
            The CPA (Content Preview API) token allows you to also access
            preview data when using GraphQL playground.
          </Note>
        </Form>
      </>
    ),
  },
  {
    id: "sidebar-config",
    label: "Sidebar",
    render: () => (
      <>
        <Paragraph>
          To enable GraphQL playground in the content entry sidebar head over to
          the content model section and select the GraphQL Playground widget. It
          will be available only if you configure and install the application
          correctly.
        </Paragraph>
        <img
          src={sidebarScreenshotUrl}
          alt="Screenshot of the sidebar configuration of a content type"
        />
        <Note style={{ marginTop: "1em" }}>
          You can learn more about the sidebar location{" "}
          <TextLink
            href="https://www.contentful.com/developers/docs/extensibility/app-framework/locations/#entry-sidebar"
            target="blank"
            rel="noopener"
          >
            in the documentation
          </TextLink>
          .
        </Note>
      </>
    ),
  },
  {
    id: "feedback",
    label: "Feedback",
    render: () => (
      <>
        <Paragraph>
          If you have any feedback don't hesitate to{" "}
          <TextLink
            href="https://github.com/contentful/apps"
            target="_blank"
            rel="noopener"
          >
            open an issue on GitHub
          </TextLink>
          . We're open for contributions, too. 🙈
        </Paragraph>
      </>
    ),
  },
];

export default class Config extends Component<ConfigProps, ConfigState> {
  sdk: AppExtensionSDK;

  constructor(props: ConfigProps) {
    super(props);
    this.state = { currentTab: "configuration", parameters: { cpaToken: "" } };
    this.sdk = props.sdk;

    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    props.sdk.app.onConfigure(() => this.onConfigure());
  }

  async componentDidMount() {
    // Get current parameters of the app.
    // If the app is not installed yet, `parameters` will be `null`.
    const parameters: AppInstallationParameters | null = await this.props.sdk.app.getParameters();

    this.setState(
      parameters ? { ...this.state, parameters } : this.state,
      () => {
        // Once preparation has finished, call `setReady` to hide
        // the loading screen and present the app to a user.
        this.props.sdk.app.setReady();
      }
    );
  }

  // save and install
  onConfigure = async () => {
    try {
      const currentAppState = await this.sdk.app.getCurrentState();

      if (!this.state.parameters.cpaToken) {
        this.sdk.notifier.error("Please define the Content Preview API token.");
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

  selectTab = (tabId: string): void => {
    this.setState({ currentTab: tabId });
  };

  render() {
    const { currentTab } = this.state;

    return (
      <Card style={{ maxWidth: "38em", margin: "3em auto" }}>
        <img
          src={logoUrl}
          alt="GraphlQL Playground Logo"
          style={{ height: "5em", display: "block" }}
        />
        <Tabs role="navigation" withDivider>
          {TABS.map(({ id, label }) => (
            <Tab
              id={id}
              key={id}
              selected={id === this.state.currentTab}
              onSelect={() => this.selectTab(id)}
            >
              {label}
            </Tab>
          ))}
        </Tabs>

        {TABS.map(({ id, render }) => (
          <div
            key={id}
            style={{
              display: id === currentTab ? "block" : "none",
              padding: "1em",
            }}
          >
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
