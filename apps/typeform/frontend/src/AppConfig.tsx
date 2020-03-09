import React from 'react';
import { AppExtensionSDK, ContentType, CollectionResponse } from 'contentful-ui-extensions-sdk';
import {
  Heading,
  Paragraph,
  Typography,
  TextField,
  TextLink,
  FieldGroup,
  CheckboxField
} from '@contentful/forma-36-react-components';

type TypeFormParameters = {
  workspaceId: string;
  accessToken: string;
};

interface Props {
  sdk: AppExtensionSDK;
}

interface NormalizedContentTypes {
  name: string;
  id: string;
}

interface State {
  workspaceId: string;
  accessToken: string;
  contentTypes: NormalizedContentTypes[];
  selectedContentTypes: string[];
}

export class AppConfig extends React.Component<Props, State> {
  state: State = {
    contentTypes: [],
    selectedContentTypes: [],
    workspaceId: '',
    accessToken: ''
  };

  async componentWillMount() {
    const { sdk } = this.props;

    sdk.app.onConfigure(this.configure);
    const parameters: TypeFormParameters | null = await sdk.app.getParameters();
    const contentTypes = this.normalizeContentTypes(
      (await sdk.space.getContentTypes()) as CollectionResponse<ContentType>
    );

    this.setState(
      {
        accessToken: parameters?.accessToken || '',
        workspaceId: parameters?.workspaceId || '',
        contentTypes
      },

      () => sdk.app.setReady()
    );
  }

  setWorkSpaceId = (id: string) => {
    this.setState({ workspaceId: id.trim() });
  };

  setAccessToken = (token: string) => {
    this.setState({ accessToken: token.trim() });
  };

  normalizeContentTypes = (
    contentTypes: CollectionResponse<ContentType>
  ): NormalizedContentTypes[] => {
    return contentTypes.items.map(contentType => ({
      name: contentType.name,
      id: contentType.sys.id
    }));
  };

  configure = async () => {
    const { sdk } = this.props;
    const { workspaceId, accessToken } = this.state;
    if (!this.state.workspaceId) {
      sdk.notifier.error('You must provide a workspace ID');
      return false;
    }

    if (!this.state.accessToken) {
      sdk.notifier.error('You must provide an access token');
      return false;
    }

    return {
      parameters: {
        workspaceId,
        accessToken
      },
      tagetState: {}
    };
  };

  render() {
    return (
      <div className="app">
        <div className="background" />
        <div className="body">
          <div className="config">
            <div className="section">
              <Typography>
                <Heading>About Typeform</Heading>
                <Paragraph className="about-p">
                  The{' '}
                  <TextLink
                    href="https://www.typeform.com/"
                    target="_blank"
                    rel="noopener noreferrer">
                    Typeform
                  </TextLink>{' '}
                  app allows you to view your forms from Typeform without leaving Contentful.
                </Paragraph>
              </Typography>
              <hr />
            </div>
            <div className="section">
              <Typography>
                <Heading>Configuration</Heading>
                <TextField
                  required
                  testId="projectId"
                  name="projectId"
                  id="projectId"
                  className="project-id"
                  labelText="Typeform workspace ID"
                  value={this.state.workspaceId}
                  // @ts-ignore 2339
                  onChange={e => this.setWorkSpaceId(e.target.value)}
                  helpText="To get the workspace ID, go to your workspace in your Typeform Dashboard and copy the ID from the URL."
                />
                <TextField
                  required
                  testId="projectId"
                  name="projectId"
                  id="projectId"
                  className="project-id"
                  labelText="Typeform access token"
                  value={this.state.accessToken}
                  // @ts-ignore 2339
                  onChange={e => this.setAccessToken(e.target.value)}
                  helpText="To get your access token go to your Typeform profile and create a new access token."
                />
              </Typography>
              <Typography>
                <Heading>Assign to content types</Heading>
                <Paragraph>Select which content types to use with Typeform App.</Paragraph>
                <FieldGroup>
                  {this.state.contentTypes.map(cotentType => (
                    <CheckboxField
                      onChange={() => {}}
                      labelText={cotentType.name}
                      name={cotentType.name}
                      checked={this.state.selectedContentTypes.includes(cotentType.id)}
                      value={cotentType.id}
                      id={cotentType.name}
                      key={cotentType.id}
                      data-test-id={`ct-item-${cotentType.id}`}
                    />
                  ))}
                </FieldGroup>
              </Typography>
            </div>
          </div>
        </div>
        <div className="logo"></div>
      </div>
    );
  }
}
