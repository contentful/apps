import React from 'react';
import { AppExtensionSDK, CollectionResponse, EditorInterface } from 'contentful-ui-extensions-sdk';
import {
  Heading,
  Paragraph,
  Typography,
  FieldGroup,
  CheckboxField,
  TextField,
  TextLink
} from '@contentful/forma-36-react-components';
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
    projectId: ''
  };

  async componentDidMount() {
    const { sdk } = this.props;

    sdk.app.onConfigure(this.configure);

    const [ctsRes, parameters, eiRes] = await Promise.all([
      sdk.space.getContentTypes(),
      sdk.app.getParameters() as Promise<SmartlingParameters | null>,
      sdk.space.getEditorInterfaces()
    ]);

    const selectedContentTypes = (eiRes as CollectionResponse<EditorInterface>).items
      .filter(ei =>
        get(ei, ['sidebar'], []).some(item => {
          return item.widgetNamespace === 'app' && item.widgetId === this.props.sdk.ids.app;
        })
      )
      .map(ei => get(ei, ['sys', 'contentType', 'sys', 'id']))
      .filter(ctId => typeof ctId === 'string' && ctId.length > 0);

    const items = ctsRes ? (ctsRes.items as { name: string; sys: { id: string } }[]) : [];

    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState(
      {
        contentTypes: items.map(ct => ({ name: ct.name, id: ct.sys.id })),
        projectId: parameters ? parameters.projectId : '',
        selectedContentTypes
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
        projectId: this.state.projectId
      },
      targetState: {
        EditorInterface: this.state.selectedContentTypes.reduce((acc: any, ct) => {
          acc[ct] = { sidebar: { position: 1 } };
          return acc;
        }, {})
      }
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
          selectedContentTypes: selectedContentTypes.filter(ct => ct !== id)
        };
      }

      return {
        selectedContentTypes: selectedContentTypes.concat([id])
      };
    });
  }

  render() {
    return (
      <div className="app">
        <div className="background" />
        <div className="body">
          <div className="config">
            <div className="section">
              <Typography>
                <Heading>About Smartling</Heading>
                <Paragraph className="about-p">
                  This app allows you to view the translation status of entries in the Contentful
                  web app and easily find corresponding entries within a <TextLink href="https://dashboard.smartling.com" target="_blank" rel="noopener noreferrer">Smartling</TextLink> project. 
                </Paragraph>
              </Typography>
              <hr />
            </div>
            <div className="section">
              <Typography>
                <Heading>Configuration</Heading>
              </Typography>
              <TextField
                required
                testId="projectId"
                name="projectId"
                id="projectId"
                className="project-id"
                labelText="Smartling project ID"
                value={this.state.projectId}
                // @ts-ignore 2339
                onChange={e => this.setProjectId(e.target.value)}
                helpText="To get the project ID, see the 'Project Settings > API' of your Smartling project."
              />
              <Typography>
                <Heading>Assign to content types</Heading>
                <Paragraph>
                  Select which content types will show the Smartling functionality in the sidebar.
                </Paragraph>
              </Typography>
              <FieldGroup>
                {this.state.contentTypes.map(ct => (
                  <CheckboxField
                    onChange={() => this.toggleCt(ct.id)}
                    labelText={ct.name}
                    name={ct.name}
                    checked={this.state.selectedContentTypes.includes(ct.id)}
                    value={ct.id}
                    id={ct.name}
                    key={ct.id}
                    data-test-id={`ct-item-${ct.id}`}
                  />
                ))}
              </FieldGroup>
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
