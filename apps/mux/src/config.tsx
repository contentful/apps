/* eslint-disable jsx-a11y/media-has-caption */

import React from 'react';

import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import {
  Heading,
  Subheading,
  Note,
  Form,
  TextField,
  CheckboxField,
  Paragraph,
  Typography,
  FieldGroup,
  TextLink,
} from '@contentful/forma-36-react-components';
import {
  AppExtensionSDK,
  AppConfigAPI,
  SpaceAPI,
  BaseExtensionSDK,
} from 'contentful-ui-extensions-sdk';
import {
  editorInterfacesToSelectedFields,
  getCompatibleFields,
  selectedFieldsToTargetState,
  EditorInterface,
  ContentType,
  CompatibleFields,
  SelectedFields,
} from 'shared-dam-app';
import MuxLogoSvg from './mux-logo.svg';
import './config.css';

interface ConfigProps {
  sdk: AppExtensionSDK;
}

interface IParameters {
  muxAccessTokenId?: string;
  muxAccessTokenSecret?: string;
}

interface IState {
  parameters: IParameters;
  contentTypes: ContentType[];
  compatibleFields: CompatibleFields;
  selectedFields: SelectedFields;
}

class Config extends React.Component<ConfigProps, IState> {
  app: AppConfigAPI;
  space: SpaceAPI;

  constructor(props: ConfigProps) {
    super(props);
    this.state = {
      parameters: {},
      contentTypes: [],
      compatibleFields: {},
      selectedFields: {},
    };

    // `sdk.app` exposes all app-related methods.
    this.app = this.props.sdk.app;
    this.space = this.props.sdk.space;
  }

  async componentDidMount() {
    this.app.onConfigure(() => this.onConfigure());
    // Get current parameters of the app.
    const [parameters, eisRes, contentTypesRes] = await Promise.all([
      this.app.getParameters(),
      this.space.getEditorInterfaces(),
      this.space.getContentTypes(),
    ]);

    const { ids } = this.props.sdk;

    const compatibleFields = getCompatibleFields(
      contentTypesRes.items as ContentType[]
    );
    const selectedFields = editorInterfacesToSelectedFields(
      eisRes.items as EditorInterface[],
      ids.app
    );

    this.setState(
      // If the app is not installed, `parameters` will be `null`.
      // We default to an empty object in this case.
      {
        parameters: parameters || {},
        compatibleFields,
        contentTypes: contentTypesRes.items as ContentType[],
        selectedFields,
      },
      () => {
        // Once preparation has finished, call `setReady` to hide
        // the loading screen and present the app to a user.
        this.app.setReady();
      }
    );
  }

  assignToField(contentTypeId: string, fieldId: string, enabled: boolean) {
    const { selectedFields } = this.state;
    selectedFields[contentTypeId] = [...(selectedFields[contentTypeId] || [])];
    if (enabled) {
      selectedFields[contentTypeId]!.push(fieldId);
    } else {
      selectedFields[contentTypeId] = selectedFields[contentTypeId]!.filter(
        (id) => id !== fieldId
      );
    }
    if (!selectedFields[contentTypeId]!.length)
      delete selectedFields[contentTypeId];
    this.setState({ selectedFields: { ...selectedFields } });
  }

  isChecked(contentTypeId: string, fieldId: string) {
    return (
      this.state.selectedFields[contentTypeId] &&
      this.state.selectedFields[contentTypeId]!.includes(fieldId)
    );
  }

  // Renders the UI of the app.
  render() {
    const {
      parameters: { muxAccessTokenId, muxAccessTokenSecret },
      contentTypes,
      compatibleFields,
    } = this.state;

    return (
      <React.Fragment>
        <div className="config-background" />
        <div className="config-body">
          <Typography>
            <Heading>About Mux</Heading>
            <Paragraph>
              This app connects to Mux and allows you to upload videos to your
              content in Contentful. After entering your API Credentials then
              choose which JSON fields in your content model you would like to
              configure for Mux Video. For those configured fields you'll get a
              video uploader in the Contentful UI. Your videos will be
              transcoded, stored and delivered by{' '}
              <TextLink href="https://mux.com" rel="noopener noreferrer" target="_blank">Mux</TextLink>.
            </Paragraph>
          </Typography>
          <hr className="config-splitter" />
          <Typography>
            <Form spacing="default">
              <Heading>API credentials</Heading>
              <Paragraph>
                These can be obtained by clicking 'Generate new token' in the{' '}
                <TextLink href="https://dashboard.mux.com/settings/access-tokens" rel="noopener noreferrer" target="_blank">
                  settings on your dashboard
                </TextLink>
                . Note that you must be an admin in your Mux account.
              </Paragraph>
              <TextField
                required
                name="mux-access-token"
                id="mux-access-token"
                labelText="Mux access token"
                value={muxAccessTokenId || ''}
                onChange={(e) =>
                  this.setState({
                    parameters: {
                      muxAccessTokenId: (e.target as HTMLTextAreaElement).value,
                      muxAccessTokenSecret,
                    },
                  })
                }
              />
              <TextField
                required
                name="mux-token-secret"
                id="mux-token-secret"
                labelText="Mux token secret"
                value={muxAccessTokenSecret || ''}
                onChange={(e) =>
                  this.setState({
                    parameters: {
                      muxAccessTokenId,
                      muxAccessTokenSecret: (e.target as HTMLTextAreaElement)
                        .value,
                    },
                  })
                }
                textInputProps={{ type: 'password' }}
              />
              <hr className="config-splitter" />
              <Heading>Assign to fields</Heading>
              <Paragraph>
                This app is meant to be used with <strong>JSON object</strong>{' '}
                fields. Select which JSON fields you'd like to enable for this
                app.
              </Paragraph>
              {Object.keys(compatibleFields || {})
                .filter(
                  (contentTypeId) => compatibleFields[contentTypeId].length
                )
                .map((contentTypeId) => {
                  const contentType = contentTypes.find(
                    ({ sys }) => sys.id === contentTypeId
                  );
                  return (
                    <div key={contentTypeId}>
                      <Subheading>{contentType && contentType.name}</Subheading>
                      {compatibleFields[contentTypeId].length &&
                        compatibleFields[contentTypeId].map(
                          ({ id: fieldId, name: fieldName }) => {
                            return (
                              <FieldGroup key={fieldId}>
                                <CheckboxField
                                  labelText={fieldName}
                                  helpText={`Field ID: ${fieldId}`}
                                  name={`${contentTypeId}-${fieldName}`}
                                  value={fieldId}
                                  id={fieldId}
                                  checked={this.isChecked(
                                    contentTypeId,
                                    fieldId
                                  )}
                                  onChange={(e) =>
                                    this.assignToField(
                                      contentTypeId,
                                      fieldId,
                                      (e.target as HTMLInputElement).checked
                                    )
                                  }
                                />
                              </FieldGroup>
                            );
                          }
                        )}
                    </div>
                  );
                })}
            </Form>
          </Typography>
          <hr className="config-splitter" />
          <Paragraph>
            After entering your API credentials, click 'Install' above.
          </Paragraph>
        </div>
        <div className="config-logo-bottom">
          <img src={MuxLogoSvg} />
        </div>
      </React.Fragment>
    );
  }

  async onConfigure() {
    const { parameters } = this.state;
    let valid = true;
    if (!(parameters.muxAccessTokenId && parameters.muxAccessTokenId.trim())) {
      valid = false;
    }
    if (
      !(
        parameters.muxAccessTokenSecret &&
        parameters.muxAccessTokenSecret.trim()
      )
    ) {
      valid = false;
    }

    if (!valid) {
      this.props.sdk.notifier.error(
        'Please enter a valid access token and secret.'
      );
      return false;
    }

    const targetState = selectedFieldsToTargetState(
      this.state.contentTypes,
      this.state.selectedFields
    );

    return {
      parameters,
      targetState,
    };
  }
}

export default Config;
