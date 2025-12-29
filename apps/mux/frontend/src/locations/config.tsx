/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import React from 'react';

import { AppExtensionSDK, AppConfigAPI, SpaceAPI } from '@contentful/app-sdk';
import {
  editorInterfacesToSelectedFields,
  getCompatibleFields,
  selectedFieldsToTargetState,
  EditorInterface,
  ContentType,
  CompatibleFields,
  SelectedFields,
} from '@contentful/dam-app-base';
import MuxLogoSvg from '../images/mux-logo.svg';
import './config.css';
import ApiClient from '../util/apiClient';

import {
  Checkbox,
  Form,
  Note,
  Spinner,
  FormControl,
  TextInput,
  TextLink,
  Heading,
  Paragraph,
  Subheading,
  Box,
} from '@contentful/f36-components';

interface ConfigProps {
  sdk: AppExtensionSDK;
}

interface IParameters {
  muxAccessTokenId?: string;
  muxAccessTokenSecret?: string;
  muxEnableSignedUrls?: boolean;
  muxSigningKeyId?: string;
  muxSigningKeyPrivate?: string;
  muxEnableAudioNormalize?: boolean;
  muxDomain?: string;
  muxEnableDRM?: boolean;
  muxDRMConfigurationId?: string;
}

interface IState {
  parameters: IParameters;
  contentTypes: ContentType[];
  compatibleFields: CompatibleFields;
  selectedFields: SelectedFields;
  isEnablingSignedUrls: boolean;
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
      isEnablingSignedUrls: false,
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

    const compatibleFields = getCompatibleFields(contentTypesRes.items as ContentType[]);
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
      selectedFields[contentTypeId] = selectedFields[contentTypeId]!.filter((id) => id !== fieldId);
    }
    if (!selectedFields[contentTypeId]!.length) delete selectedFields[contentTypeId];
    this.setState({ selectedFields: { ...selectedFields } });
  }

  isChecked(contentTypeId: string, fieldId: string) {
    return (
      this.state.selectedFields[contentTypeId] &&
      this.state.selectedFields[contentTypeId]!.includes(fieldId)
    );
  }

  haveValidSigningKeys = async () => {
    if (!(this.state.parameters.muxSigningKeyId && this.state.parameters.muxSigningKeyPrivate))
      return;
    const apiClient = new ApiClient(
      this.state.parameters.muxAccessTokenId!,
      this.state.parameters.muxAccessTokenSecret!
    );
    const signingKeyExists = await apiClient
      .get(`/video/v1/signing-keys/${this.state.parameters.muxSigningKeyId}`)
      .then((res) => res.status === 200);
    return signingKeyExists;
  };

  haveApiCredentials = () => {
    return this.state.parameters.muxAccessTokenId && this.state.parameters.muxAccessTokenSecret;
  };

  toggleNormalize = async (enabled: boolean) => {
    if (!enabled) {
      this.setState({
        parameters: {
          ...this.state.parameters,
          muxEnableAudioNormalize: false,
        },
      });
      return;
    } else {
      this.setState({
        parameters: {
          ...this.state.parameters,
          muxEnableAudioNormalize: true,
        },
      });
      return;
    }
  };

  toggleSignedUrls = async (enabled: boolean) => {
    if (!enabled) {
      this.setState({
        parameters: {
          ...this.state.parameters,
          muxEnableSignedUrls: false,
        },
      });
      return;
    }

    if (await this.haveValidSigningKeys()) {
      this.setState({
        parameters: {
          ...this.state.parameters,
          muxEnableSignedUrls: true,
        },
      });
      return;
    }

    const apiClient = new ApiClient(
      this.state.parameters.muxAccessTokenId!,
      this.state.parameters.muxAccessTokenSecret!
    );
    this.setState({ isEnablingSignedUrls: true });
    let res;
    try {
      res = await apiClient.post('/video/v1/signing-keys');
    } catch (e) {
      this.props.sdk.notifier.error('Error creating signing keys, please refresh and try again');
      return;
    }
    if (res.status === 401) {
      this.props.sdk.notifier.error('It looks like your access token or secret is incorrect');
      return;
    }
    const json = await res.json();
    const { data: signingKey } = json;
    this.setState({
      isEnablingSignedUrls: false,
      parameters: {
        ...this.state.parameters,
        muxSigningKeyId: signingKey.id,
        muxSigningKeyPrivate: signingKey.private_key,
        muxEnableSignedUrls: true,
      },
    });
  };

  // Renders the UI of the app.
  render() {
    const {
      parameters: {
        muxAccessTokenId,
        muxAccessTokenSecret,
        muxEnableSignedUrls,
        muxSigningKeyId,
        muxEnableAudioNormalize,
        muxDomain,
        muxEnableDRM,
        muxDRMConfigurationId,
      },
      contentTypes,
      compatibleFields,
    } = this.state;

    return (
      <React.Fragment>
        <div className="config-background" />
        <div className="config-body">
          <Heading>About Mux</Heading>
          <Paragraph>
            This app connects to Mux and allows you to upload videos to your content in Contentful.
            After entering your API Credentials then choose which JSON fields in your content model
            you would like to configure for Mux Video. For those configured fields you'll get a
            video uploader in the Contentful UI. Your videos will be transcoded, stored and
            delivered by{' '}
            <TextLink href="https://mux.com" rel="noopener noreferrer" target="_blank">
              Mux
            </TextLink>
            .
          </Paragraph>
          <hr className="config-splitter" />
          <Form>
            <Heading>API credentials</Heading>
            <Paragraph>
              These can be obtained by clicking 'Generate new token' in the{' '}
              <TextLink
                href="https://dashboard.mux.com/settings/access-tokens"
                rel="noopener noreferrer"
                target="_blank">
                settings on your dashboard
              </TextLink>
              . Note that you must be an admin in your Mux account.
            </Paragraph>
            <FormControl id="mux-access-token" isRequired>
              <FormControl.Label>Mux access token</FormControl.Label>
              <TextInput
                name="mux-access-token"
                value={muxAccessTokenId || ''}
                onChange={(e) =>
                  this.setState({
                    parameters: {
                      ...this.state.parameters,
                      muxAccessTokenId: (e.target as HTMLTextAreaElement).value,
                    },
                  })
                }
              />
            </FormControl>
            <FormControl id="mux-token-secret" isRequired>
              <FormControl.Label>Mux token secret</FormControl.Label>
              <TextInput
                name="mux-token-secret"
                value={muxAccessTokenSecret || ''}
                onChange={(e) =>
                  this.setState({
                    parameters: {
                      ...this.state.parameters,
                      muxAccessTokenSecret: (e.target as HTMLTextAreaElement).value,
                    },
                  })
                }
                type="password"
              />
            </FormControl>
            <hr className="config-splitter" />
            <Heading>Assign to fields</Heading>
            <Paragraph>
              This app is meant to be used with <strong>JSON object</strong> fields. Select which
              JSON fields you'd like to enable for this app.
            </Paragraph>
            {Object.keys(compatibleFields || {})
              .filter((contentTypeId) => compatibleFields[contentTypeId].length)
              .map((contentTypeId) => {
                const contentType = contentTypes.find(({ sys }) => sys.id === contentTypeId);
                return (
                  <div key={contentTypeId}>
                    <Subheading>{contentType && contentType.name}</Subheading>
                    {compatibleFields[contentTypeId].length &&
                      compatibleFields[contentTypeId].map(({ id: fieldId, name: fieldName }) => {
                        return (
                          <Checkbox
                            id={fieldId}
                            helpText={`Field ID: ${fieldId}`}
                            name={`${contentTypeId}-${fieldName}`}
                            value={fieldId}
                            isChecked={this.isChecked(contentTypeId, fieldId)}
                            onChange={(e) =>
                              this.assignToField(
                                contentTypeId,
                                fieldId,
                                (e.target as HTMLInputElement).checked
                              )
                            }>
                            {fieldName}
                          </Checkbox>
                        );
                      })}
                  </div>
                );
              })}
          </Form>
          <hr className="config-splitter" />
          <Form>
            <Heading marginBottom="none">Advanced: Signed URLs</Heading>
            <Box marginTop="spacingM" paddingBottom="spacingM">
              <Note variant="warning" title="This is an advanced feature">
                If you want to support signed urls you must read and understand{' '}
                <TextLink
                  href="https://docs.mux.com/docs/headless-cms-contentful#advanced-signed-urls"
                  rel="noopener noreferrer"
                  target="_blank">
                  this guide
                </TextLink>
                . To use signed URLs in your application you will have to generate valid JSON web
                tokens (JWT) on your server.
              </Note>
            </Box>
            <Checkbox
              id="mux-enable-signed_urls"
              helpText=""
              isDisabled={!this.haveApiCredentials()}
              name="mux-enable-signed-urls"
              isChecked={muxEnableSignedUrls}
              onChange={(e) => this.toggleSignedUrls((e.target as HTMLInputElement).checked)}>
              Enable signed URLs
            </Checkbox>
            {this.state.isEnablingSignedUrls && (
              <Paragraph marginBottom="none">
                <Spinner size="small" /> Creating signing keys
              </Paragraph>
            )}
            {muxEnableSignedUrls && muxSigningKeyId && (
              <Paragraph marginBottom="none">
                The signing key ID that contentful will use is{' '}
                {this.state.parameters.muxSigningKeyId}. This key is only used for previewing
                content in the Contentful UI. You should generate a different key to use in your
                application server.
              </Paragraph>
            )}
          </Form>
          <hr className="config-splitter" />
          <Form>
            <Heading marginBottom="none">Advanced: DRM </Heading>
            <Box marginTop="spacingM" paddingBottom="spacingM">
              <Note variant="warning" title="This is an advanced feature">
                DRM provides the highest level of content protection using industry-standard
                encryption. To use DRM, you must first request
                access in your Mux dashboard under Settings → Digital Rights Management. Once
                approved, you'll receive a DRM Configuration ID.{' '}
                <TextLink
                  href="https://www.mux.com/blog/protect-your-video-content-with-drm-now-ga"
                  rel="noopener noreferrer"
                  target="_blank">
                  Learn more about DRM
                </TextLink>
                .
              </Note>
            </Box>
            <Checkbox
              id="mux-enable-drm"
              helpText=""
              isDisabled={!this.haveApiCredentials()}
              name="mux-enable-drm"
              isChecked={muxEnableDRM}
              onChange={(e) =>
                this.setState({
                  parameters: {
                    ...this.state.parameters,
                    muxEnableDRM: (e.target as HTMLInputElement).checked,
                  },
                })
              }>
              Enable DRM
            </Checkbox>
            {muxEnableDRM && (
              <FormControl id="mux-drm-configuration-id" marginTop="spacingM">
                <FormControl.Label>DRM Configuration ID</FormControl.Label>
                <TextInput
                  name="mux-drm-configuration-id"
                  value={muxDRMConfigurationId || ''}
                  onChange={(e) =>
                    this.setState({
                      parameters: {
                        ...this.state.parameters,
                        muxDRMConfigurationId: (e.target as HTMLTextAreaElement).value,
                      },
                    })
                  }
                  placeholder="Enter your DRM Configuration ID from Mux dashboard"
                />
                <FormControl.HelpText>
                  This ID is provided by Mux after DRM access is approved.
                </FormControl.HelpText>
              </FormControl>
            )}
          </Form>
          <hr className="config-splitter" />
          <Checkbox
            id="mux-enable-audio-normalize"
            helpText="Adjust audio levels on videos after upload to standard audio levels."
            name="mux-enable-audio-normalize"
            isChecked={muxEnableAudioNormalize}
            onChange={(e) => this.toggleNormalize((e.target as HTMLInputElement).checked)}>
            Enable Audio Normalization
          </Checkbox>
          <hr className="config-splitter" />
          <Paragraph marginBottom="none">
            Custom Media Domain (if enabled) for dashboard playback. Otherwise leave as mux.com
          </Paragraph>
          <FormControl id="mux-domain" isRequired>
            <FormControl.Label>Mux Domain</FormControl.Label>
            <TextInput
              name="mux-domain"
              value={muxDomain || 'mux.com'}
              onChange={(e) =>
                this.setState({
                  parameters: {
                    ...this.state.parameters,
                    muxDomain: (e.target as HTMLTextAreaElement).value,
                  },
                })
              }
            />
          </FormControl>
          <hr className="config-splitter" />
          <Paragraph marginBottom="none">
            After entering your API credentials, click 'Install' or 'Save' above.
          </Paragraph>
        </div>
        <div className="config-logo-bottom">
          <img alt="Mux Logo" src={MuxLogoSvg} />
        </div>
      </React.Fragment>
    );
  }

  async onConfigure() {
    const { parameters } = this.state;
    const isParamValid = (value?: string) => (value || '').trim().length > 0;

    if (
      !isParamValid(parameters.muxAccessTokenId) ||
      !isParamValid(parameters.muxAccessTokenSecret)
    ) {
      this.props.sdk.notifier.error('Please enter a valid access token and secret.');
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
