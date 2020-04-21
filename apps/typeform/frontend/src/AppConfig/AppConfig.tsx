import React from 'react';
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import get from 'lodash/get';
import {
  Heading,
  Paragraph,
  Typography,
  TextLink,
  Select,
  Option,
  FormLabel
} from '@contentful/forma-36-react-components';
import FieldSelector from './FieldSelector';
import {
  CompatibleFields,
  ContentType,
  Hash,
  EditorInterface,
  InstallationParameters,
  SelectedFields,
  WorkspaceOption,
  WorkspacesResponse
} from '../typings';
import {
  getCompatibleFields,
  editorInterfacesToSelectedFields,
  selectedFieldsToTargetState,
  validateParameters,
  getToken
} from '../utils';
import { styles } from './styles';

// @ts-ignore 2307
import logo from './config-screen-logo.svg';

interface Props {
  sdk: AppExtensionSDK;
  expireSoon: boolean;
}

interface State {
  selectedWorkspaceId: string;
  accessToken: string;
  workspaces: WorkspaceOption[];
  contentTypes: ContentType[];
  selectedContentTypes: string[];
  selectedFields: SelectedFields;
  compatibleFields: CompatibleFields;
}

export class AppConfig extends React.Component<Props, State> {
  state: State = {
    contentTypes: [],
    compatibleFields: {},
    workspaces: [],
    selectedContentTypes: [],
    selectedFields: {},
    selectedWorkspaceId: '',
    accessToken: getToken()
  };

  async componentDidMount() {
    const { sdk } = this.props;

    sdk.app.onConfigure(this.onAppConfigure);

    const [contentTypesResponse, eisResponse, paramsResponse] = await Promise.all([
      sdk.space.getContentTypes(),
      sdk.space.getEditorInterfaces(),
      sdk.app.getParameters(),
      this.fetchWorkspaces()
    ]);

    const contentTypes = (contentTypesResponse as Hash).items as ContentType[];
    const editorInterfaces = (eisResponse as Hash).items as EditorInterface[];
    const compatibleFields = getCompatibleFields(contentTypes);
    const filteredContentTypes = contentTypes.filter(ct => {
      const fields = compatibleFields[ct.sys.id];
      return fields && fields.length > 0;
    });

    const parameters: InstallationParameters = paramsResponse as InstallationParameters;

    this.setState(
      {
        selectedWorkspaceId: get(parameters, ['selectedWorkspaceId'], ''),
        compatibleFields,
        contentTypes: filteredContentTypes,
        selectedFields: editorInterfacesToSelectedFields(editorInterfaces, sdk.ids.app)
      },
      () => sdk.app.setReady()
    );
  }

  fetchWorkspaces = async () => {
    try {
      const response = await fetch(`/workspaces`, {
        headers: {
          Authorization: `Bearer ${this.state.accessToken}`
        }
      });
      const result: WorkspacesResponse = await response.json();
      this.setState({ workspaces: this.normalizeWorkspaceResponse(result) });
    } catch (_error) {
      this.props.sdk.notifier.error(
        'There was a problem fetching your Typeform workspaces. Please try again.'
      );
    }
  };

  normalizeWorkspaceResponse = (response: WorkspacesResponse) => {
    return response.workspaces.items.map(workspace => ({
      name: workspace.name,
      id: workspace.id
    }));
  };

  onAppConfigure = () => {
    const { accessToken, selectedWorkspaceId, contentTypes, selectedFields } = this.state;
    const parameters = { selectedWorkspaceId, accessToken };
    const error = validateParameters(parameters);
    const hasStaleWorkspaceIdSelected = !this.selectedWorkspaceIdIsValid();

    if (error) {
      this.props.sdk.notifier.error(error);
      return false;
    }

    if (hasStaleWorkspaceIdSelected) {
      this.props.sdk.notifier.error('Select a valid workspace.');
      return false;
    }

    return {
      parameters: { selectedWorkspaceId },
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields)
    };
  };

  selectedWorkspaceIdIsValid = (): boolean => {
    return !!this.state.workspaces.find(
      workspace => workspace.id === this.state.selectedWorkspaceId
    );
  };

  setWorkSpaceId = (id: string) => {
    this.setState({ selectedWorkspaceId: id.trim() });
  };

  setAccessToken = (token: string) => {
    this.setState({ accessToken: token.trim() });
  };

  onSelectedFieldsChange = (selectedFields: SelectedFields) => {
    this.setState({ selectedFields });
  };

  render() {
    const {
      contentTypes,
      compatibleFields,
      selectedFields,
      selectedWorkspaceId,
      workspaces
    } = this.state;

    return (
      <div>
        <div className={styles.background('#262627')} />
        <div className={styles.body}>
          <div>
            <div>
              <Typography>
                <Heading>About Typeform</Heading>
                <Paragraph className={styles.aboutP}>
                  The{' '}
                  <TextLink
                    href="https://www.typeform.com/"
                    target="_blank"
                    rel="noopener noreferrer">
                    Typeform
                  </TextLink>{' '}
                  app allows you to reference your forms from Typeform without leaving Contentful.
                </Paragraph>
              </Typography>
              <hr className={styles.splitter} />
            </div>
            <div>
              <Typography>
                <Heading>Configuration</Heading>
                <FormLabel htmlFor="workspaceId" required>
                  Typeform workspace
                </FormLabel>
                <Select
                  id="workspaceId"
                  name="workspaceId"
                  onChange={(event: any) => this.setWorkSpaceId(event.currentTarget.value)}
                  hasError={workspaces.length > 0 && !this.selectedWorkspaceIdIsValid()}
                  value={selectedWorkspaceId}
                  data-test-id="typeform-select">
                  <Option key="" value="">
                    {workspaces.length === 0 ? 'No workspaces available' : 'Choose workspace'}
                  </Option>
                  {workspaces.map(workspace => (
                    <Option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </Option>
                  ))}
                </Select>
              </Typography>
              <hr className={styles.splitter} />
              <Typography>
                <Heading>Assign to content types</Heading>
                {contentTypes.length > 0 ? (
                  <>
                    <Paragraph>
                      This app can only be used with <strong>Short text</strong> fields. Select
                      which content types to use with the Typeform App.
                    </Paragraph>
                    <FieldSelector
                      contentTypes={contentTypes}
                      compatibleFields={compatibleFields}
                      selectedFields={selectedFields}
                      onSelectedFieldsChange={this.onSelectedFieldsChange}
                    />
                  </>
                ) : (
                  <Paragraph>
                    No content types with fields of type <strong>Short Text</strong> were found.
                  </Paragraph>
                )}
              </Typography>
            </div>
          </div>
        </div>
        <div className={styles.icon}>
          <img src={logo} alt="typeform logo" />
        </div>
      </div>
    );
  }
}
