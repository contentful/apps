import React from 'react';
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import get from 'lodash/get';
import {
  Heading,
  Paragraph,
  Typography,
  TextField,
  TextLink
} from '@contentful/forma-36-react-components';

import FieldSelector from './FieldSelector';
import {
  CompatibleFields,
  ContentType,
  Hash,
  EditorInterface,
  InstallationParameters,
  SelectedFields
} from '../typings';
import {
  getCompatibleFields,
  editorInterfacesToSelectedFields,
  selectedFieldsToTargetState,
  validateParamameters
} from '../utils';

import { styles } from './styles';

// @ts-ignore 2307
import logo from './config-screen-logo.svg';

interface Props {
  sdk: AppExtensionSDK;
}

interface State {
  workspaceId: string;
  accessToken: string;
  contentTypes: ContentType[];
  selectedContentTypes: string[];
  selectedFields: SelectedFields;
  compatibleFields: CompatibleFields;
}

export class AppConfig extends React.Component<Props, State> {
  state: State = {
    contentTypes: [],
    compatibleFields: {},
    selectedContentTypes: [],
    selectedFields: {},
    workspaceId: '',
    accessToken: ''
  };

  async componentDidMount() {
    const { sdk } = this.props;

    sdk.app.onConfigure(this.onAppConfigure);

    const [contentTypesResponse, eisResponse, paramsResponse] = await Promise.all([
      sdk.space.getContentTypes(),
      sdk.space.getEditorInterfaces(),
      sdk.app.getParameters()
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
        accessToken: get(parameters, ['accessToken'], ''),
        workspaceId: get(parameters, ['workspaceId'], ''),
        compatibleFields,
        contentTypes: filteredContentTypes,
        selectedFields: editorInterfacesToSelectedFields(editorInterfaces, sdk.ids.app)
      },
      () => sdk.app.setReady()
    );
  }

  onAppConfigure = () => {
    const { accessToken, workspaceId, contentTypes, selectedFields } = this.state;
    const parameters = { accessToken, workspaceId };
    const error = validateParamameters(parameters);

    if (error) {
      this.props.sdk.notifier.error(error);
      return false;
    }

    return {
      parameters: { accessToken, workspaceId },
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields)
    };
  };

  setWorkSpaceId = (id: string) => {
    this.setState({ workspaceId: id.trim() });
  };

  setAccessToken = (token: string) => {
    this.setState({ accessToken: token.trim() });
  };

  onSelectedFieldsChange = (selectedFields: SelectedFields) => {
    this.setState({ selectedFields });
  };

  render() {
    const { contentTypes, compatibleFields, selectedFields } = this.state;

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
                <TextField
                  required
                  testId="workspaceId"
                  name="workspaceId"
                  id="workspaceId"
                  labelText="Typeform workspace ID"
                  value={this.state.workspaceId}
                  // @ts-ignore 2339
                  onChange={e => this.setWorkSpaceId(e.target.value)}
                  helpText="To get the workspace ID, go to your workspace in your Typeform Dashboard and copy the ID from the URL."
                />
                <TextField
                  required
                  testId="accessToken"
                  name="accessToken"
                  id="accessToken"
                  className={styles.accessToken}
                  labelText="Typeform access token"
                  value={this.state.accessToken}
                  // @ts-ignore 2339
                  onChange={e => this.setAccessToken(e.target.value)}
                  helpText="To get your access token go to your Typeform profile and create a new access token."
                />
              </Typography>
              <hr className={styles.splitter} />
              <Typography>
                <Heading>Assign to content types</Heading>
                {contentTypes.length > 0 ? (
                  <>
                    <Paragraph>Select which content types to use with Typeform App.</Paragraph>
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
