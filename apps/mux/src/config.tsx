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
} from '@contentful/forma-36-react-components';
import { BaseExtensionSDK } from 'contentful-ui-extensions-sdk';
import MuxLogoSvg from './mux-logo.svg';
import './config.css';

interface ConfigProps {
  sdk: BaseExtensionSDK;
}

class Config extends React.Component<ConfigProps, {}> {
  constructor(props: ConfigProps) {
    super(props);
    this.state = { parameters: {}, contentTypes: [], editorInterface: {} };

    // `sdk.app` exposes all app-related methods.
    this.app = this.props.sdk.app;
    this.space = this.props.sdk.space;

    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    this.app.onConfigure(() => this.onConfigure());
  }

  async componentDidMount() {
    // Get current parameters of the app.
    const [parameters, eisRes, contentTypesRes] = await Promise.all([
      this.app.getParameters(),
      this.space.getEditorInterfaces(),
      this.space.getContentTypes(),
    ]);

    const { ids } = this.props.sdk;

    const contentTypesWithJSONFields = contentTypesRes.items.filter(
      ({ fields }) => fields.filter(({ type }) => type === 'Object').length
    );

    const editorInterface = {};
    contentTypesWithJSONFields.forEach(({ sys, fields }) => {
      const contentTypeId = sys.id;
      editorInterface[contentTypeId] = {
        controls: fields
          .filter(({ type }) => type === 'Object')
          .map(({ id }) => {
            const contentType = eisRes.items.find(
              ({ sys }) => sys.contentType.sys.id === contentTypeId
            );
            const field = contentType.controls.find(
              ({ fieldId }) => fieldId === id
            );
            if (field.widgetId === ids.app) {
              return { fieldId: id };
            }
          })
          .filter((obj) => !!obj),
      };
    });

    this.setState(
      // If the app is not installed, `parameters` will be `null`.
      // We default to an empty object in this case.
      {
        parameters: parameters || {},
        contentTypes: contentTypesWithJSONFields,
        editorInterface,
      },
      () => {
        // Once preparation has finished, call `setReady` to hide
        // the loading screen and present the app to a user.
        this.app.setReady();
      }
    );
  }

  assignToField(contentTypeId: string, fieldId: string, enabled: boolean) {
    const { editorInterface } = this.state;
    editorInterface[contentTypeId] = editorInterface[contentTypeId] || {};
    editorInterface[contentTypeId].controls =
      editorInterface[contentTypeId].controls || [];
    if (enabled) {
      editorInterface[contentTypeId].controls.push({ fieldId });
    } else {
      editorInterface[contentTypeId].controls = editorInterface[
        contentTypeId
      ].controls.filter(({ fieldId: id }) => id !== fieldId);
    }
    this.setState({ editorInterface: { ...editorInterface } });
  }

  isChecked(contentTypeId: string, fieldId: string) {
    const { editorInterface } = this.state;
    return !!(
      editorInterface[contentTypeId] && editorInterface[contentTypeId].controls
    ).find(({ fieldId: id }) => id === fieldId);
  }

  // Renders the UI of the app.
  render() {
    const {
      parameters: { muxAccessTokenId, muxAccessTokenSecret },
      contentTypes,
      editorInterface,
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
              <a href="https://mux.com">Mux</a>.
            </Paragraph>
          </Typography>
          <hr className="config-splitter" />
          <Typography>
            <Form id="app-config" spacing="default">
              <Heading>API credentials</Heading>
              <Paragraph>
                These can be obtained by clicking 'Generate new token' in the{' '}
                <a href="https://dashboard.mux.com/settings/access-tokens">
                  settings on your dashboard
                </a>
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
                      muxAccessTokenId: e.target.value,
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
                      muxAccessTokenSecret: e.target.value,
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
              {(contentTypes || []).map(
                ({ name: contentTypeName, sys, fields, displayField }) => {
                  const contentTypeId = sys.id;
                  return (
                    <div key={contentTypeId}>
                      <Subheading>{contentTypeName}</Subheading>
                      {fields &&
                        fields
                          .filter(({ type }) => type === 'Object')
                          .map(({ id: fieldId, name: fieldName }) => {
                            return (
                              <FieldGroup key={fieldId}>
                                <CheckboxField
                                  labelText={fieldName}
                                  helpText={`Field ID: ${fieldId}`}
                                  name={`${contentTypeName}-${fieldName}`}
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
                                      e.target.checked
                                    )
                                  }
                                />
                              </FieldGroup>
                            );
                          })}
                    </div>
                  );
                }
              )}
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
    const { parameters, editorInterface } = this.state;
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

    // Return value of `onConfigure` is used to install
    // or update the configuration.
    return {
      // Parameters to be persisted as the app configuration.
      parameters: this.state.parameters,
      targetState: {
        EditorInterface: editorInterface,
      },
    };
  }
}

export default Config;
