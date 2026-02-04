import React from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import get from 'lodash/get';
import {
  Heading,
  Paragraph,
  TextLink,
  Select,
  Option,
  FormLabel,
  Note,
  Flex,
  Box,
  Subheading,
  Stack,
} from '@contentful/f36-components';
import ContentTypeMultiSelect, { ContentType } from '../components/ContentTypeMultiSelect';
import { OAuthConnector } from '../components/OAuthConnector';
import { InstallationParameters, WorkspaceOption, WorkspacesResponse } from '../typings';
import { validateParameters, getToken, resetLocalStorage } from '../utils';
import { styles } from './styles';
import { BASE_URL } from '../constants';

const AUTH_ERROR_CODES = [401, 403];

interface Props {
  sdk: AppExtensionSDK;
  expireSoon: boolean;
}

interface State {
  selectedWorkspaceId: string;
  baseUrl: string;
  accessToken: string;
  workspaces: WorkspaceOption[];
  selectedContentTypes: ContentType[];
}

export class AppConfig extends React.Component<Props, State> {
  state: State = {
    workspaces: [],
    selectedContentTypes: [],
    selectedWorkspaceId: '',
    baseUrl: BASE_URL,
    accessToken: getToken(),
  };

  async componentDidMount() {
    const { sdk } = this.props;

    sdk.app.onConfigure(this.onAppConfigure);

    const paramsResponse = await sdk.app.getParameters();
    const parameters: InstallationParameters = paramsResponse as InstallationParameters;
    const effectiveBaseUrl = get(parameters, ['baseUrl'], BASE_URL);
    const effectiveAccessToken = getToken(effectiveBaseUrl);

    this.setState(
      {
        selectedWorkspaceId: get(parameters, ['selectedWorkspaceId'], ''),
        baseUrl: effectiveBaseUrl,
        accessToken: effectiveAccessToken,
      },
      () => {
        sdk.app.setReady();
        // Fetch workspaces after state is set
        if (effectiveAccessToken) {
          this.fetchWorkspaces();
        }
      }
    );
  }

  fetchWorkspaces = async () => {
    try {
      const { baseUrl, accessToken } = this.state;

      if (!accessToken) {
        return;
      }

      const apiUrl = `${window.location.origin}/workspaces?baseUrl=${encodeURIComponent(baseUrl)}`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (AUTH_ERROR_CODES.includes(response.status)) {
        resetLocalStorage(baseUrl);
        this.setState({ accessToken: '' });
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        if (AUTH_ERROR_CODES.includes(response.status)) {
          resetLocalStorage(baseUrl);
          this.setState({ accessToken: '' });
          return;
        }
        throw new Error(`Failed to fetch workspaces: ${response.status} ${errorText}`);
      }

      const result: WorkspacesResponse = (await response.json()) as WorkspacesResponse;
      this.setState({ workspaces: this.normalizeWorkspaceResponse(result) });
    } catch (error) {
      this.props.sdk.notifier.error(
        'There was a problem fetching your Typeform workspaces. Please try again.'
      );
    }
  };

  normalizeWorkspaceResponse = (response: WorkspacesResponse) => {
    return response.workspaces.items.map((workspace) => ({
      name: workspace.name,
      id: workspace.id,
    }));
  };

  onAppConfigure = () => {
    const { accessToken, selectedWorkspaceId, baseUrl, selectedContentTypes } = this.state;
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

    // Convert selectedContentTypes to targetState format
    const editorInterface = selectedContentTypes.reduce((acc, contentType) => {
      return {
        ...acc,
        [contentType.id]: {
          sidebar: { position: 0 },
        },
      };
    }, {});

    return {
      parameters: { selectedWorkspaceId, baseUrl },
      targetState: { EditorInterface: editorInterface },
    };
  };

  selectedWorkspaceIdIsValid = (): boolean => {
    return !!this.state.workspaces.find(
      (workspace) => workspace.id === this.state.selectedWorkspaceId
    );
  };

  setWorkSpaceId = (id: string) => {
    this.setState({ selectedWorkspaceId: id.trim() });
  };

  setBaseUrl = (baseUrl: string) => {
    const trimmedBaseUrl = baseUrl.trim();
    const tokenForNewBaseUrl = getToken(trimmedBaseUrl);
    this.setState({ baseUrl: trimmedBaseUrl, accessToken: tokenForNewBaseUrl }, () => {
      if (tokenForNewBaseUrl) {
        this.fetchWorkspaces();
      }
    });
  };

  setAccessToken = (token: string) => {
    this.setState({ accessToken: token.trim() }, () => {
      if (token) {
        this.fetchWorkspaces();
      }
    });
  };

  render() {
    const { selectedWorkspaceId, baseUrl, workspaces, selectedContentTypes, accessToken } =
      this.state;

    const { sdk } = this.props;
    const {
      ids: { space, environment },
    } = sdk;

    return (
      <Flex justifyContent="center" alignItems="center">
        <Box marginBottom="spacing2Xl" marginTop="spacing2Xl" className={styles.body}>
          <Heading marginBottom="spacingS">Set up Typeform</Heading>
          <Paragraph marginBottom="spacingXl">
            The{' '}
            <TextLink href="https://www.typeform.com/" target="_blank" rel="noopener noreferrer">
              Typeform
            </TextLink>{' '}
            app allows you to reference your forms from Typeform without leaving Contentful.
          </Paragraph>

          <Subheading marginTop="spacingXl" marginBottom="spacing2Xs">
            Configure access
          </Subheading>
          <Paragraph marginBottom="spacingM">Section subtitle with basic instructions</Paragraph>

          <Box marginBottom="spacingL">
            <OAuthConnector
              sdk={sdk}
              baseUrl={baseUrl}
              onBaseUrlChange={this.setBaseUrl}
              onTokenChange={this.setAccessToken}
              expireSoon={this.props.expireSoon}
            />
          </Box>

          <Box marginBottom="spacingL">
            <FormLabel htmlFor="baseUrl" marginBottom="spacingXs">
              Typeform region
            </FormLabel>
            <Select
              id="baseUrl"
              name="baseUrl"
              onChange={(event: any) => this.setBaseUrl(event.currentTarget.value)}
              value={baseUrl}
              data-test-id="typeform-base-url-select">
              <Option value="https://api.typeform.com">US (typeform.com)</Option>
              <Option value="https://api.typeform.eu">EU (typeform.eu)</Option>
            </Select>
          </Box>

          {accessToken && (
            <>
              <Box marginBottom="spacingL">
                <FormLabel htmlFor="workspaceId" isRequired>
                  Typeform workspace
                </FormLabel>
                <Select
                  id="workspaceId"
                  name="workspaceId"
                  onChange={(event: any) => this.setWorkSpaceId(event.currentTarget.value)}
                  isInvalid={workspaces.length > 0 && !this.selectedWorkspaceIdIsValid()}
                  value={selectedWorkspaceId}
                  data-test-id="typeform-select">
                  <Option key="" value="">
                    {workspaces.length === 0 ? 'No workspaces available' : 'Choose workspace'}
                  </Option>
                  {workspaces.map((workspace) => (
                    <Option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </Option>
                  ))}
                </Select>
              </Box>
            </>
          )}

          <hr className={styles.splitter} />

          <Subheading marginTop="spacingXl" marginBottom="spacing2Xs">
            Assign content types
          </Subheading>
          <Paragraph marginBottom="spacingM">
            Select the content type(s) you want to use with Typeform. You can change this anytime by
            navigating to the 'Sidebar' tab in your content model.
          </Paragraph>
          <Paragraph marginBottom="spacingXs" style={{ fontWeight: '600' }}>
            Content types
          </Paragraph>
          <ContentTypeMultiSelect
            selectedContentTypes={selectedContentTypes}
            setSelectedContentTypes={(contentTypes) =>
              this.setState({ selectedContentTypes: contentTypes })
            }
            sdk={sdk}
            cma={sdk.cma}
          />
        </Box>
      </Flex>
    );
  }
}
