import { get } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {
  Heading,
  Typography,
  Paragraph,
  TextField,
  TextLink,
  Accordion,
  AccordionItem,
  FormLabel,
} from '@contentful/forma-36-react-components';
import GatsbyIcon from '../GatsbyIcon';
import { isValidUrl } from '../utils';
import ContentTypesPanel from './ContentTypesPanel';
import styles from '../styles';

function editorInterfacesToEnabledContentTypes(eis, appId) {
  const findAppWidget = (item) => item.widgetNamespace === 'app' && item.widgetId === appId;
  return eis
    .filter((ei) => !!get(ei, ['sidebar'], []).find(findAppWidget))
    .map((ei) => get(ei, ['sys', 'contentType', 'sys', 'id']))
    .filter((ctId) => typeof ctId === 'string' && ctId.length > 0);
}

export function enabledContentTypesToTargetState(
  currentState,
  contentTypes,
  enabledContentTypes,
  usingContentSync
) {
  return {
    EditorInterface: contentTypes.reduce((acc, ct) => {
      if (usingContentSync) {
        return {
          ...acc,
          // if content sync is being used
          // auto add our preview button to each content type
          // at the top of the sidebar
          [ct.sys.id]: { sidebar: { position: 0 } },
        };
      }

      const ctCurrentStateSidebar = currentState?.EditorInterface[ct.sys.id]?.sidebar;

      const ctEditorInterface = ctCurrentStateSidebar
        ? { sidebar: ctCurrentStateSidebar }
        : { sidebar: { position: 3 } };

      return {
        ...acc,
        [ct.sys.id]: enabledContentTypes.includes(ct.sys.id) ? ctEditorInterface : {},
      };
    }, {}),
  };
}

export class AppConfig extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired,
  };

  state = {
    contentTypes: null,
    enabledContentTypes: [],
    selectorType: false,
    urlConstructors: [],
    previewUrl: '',
    /**
     * The Preview Webhook Url was historically named "webhookUrl" which is a *bit* confusing
     * since you might expect it to be called "previewWebhookUrl" In order to keep backwards
     * compatibility for users not yet using Content Sync, we must continue using the
     * variable / keyname "webhookUrl"
     */
    webhookUrl: '',
    contentSyncUrl: '',
    authToken: '',
    validPreview: true,
    validContentSync: true,
    validWebhook: true,
    validPreviewWebhook: true,
  };

  async componentDidMount() {
    const { space, app, ids } = this.props.sdk;

    const [installationParams, eisRes, contentTypesRes] = await Promise.all([
      app.getParameters(),
      space.getEditorInterfaces(),
      space.getContentTypes({ limit: 1000 }),
    ]);

    const params = installationParams || {};

    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState(
      {
        contentTypes: contentTypesRes.items,
        enabledContentTypes: editorInterfacesToEnabledContentTypes(eisRes.items, ids.app),
        selectorType: params.selectorType,
        urlConstructors: params.urlConstructors || [],
        previewUrl: params.previewUrl || '',
        webhookUrl: params.webhookUrl || '',
        contentSyncUrl: params.contentSyncUrl || '',
        authToken: params.authToken || '',
      },
      () => app.setReady()
    );

    app.onConfigure(this.configureApp);
  }

  configureApp = async () => {
    const {
      contentTypes,
      enabledContentTypes,
      urlConstructors,
      previewUrl,
      contentSyncUrl,
      webhookUrl,
      authToken,
    } = this.state;

    const validPreview = !previewUrl || isValidUrl(previewUrl);
    const validContentSync = !contentSyncUrl || isValidUrl(contentSyncUrl);
    const validWebhook = !webhookUrl || isValidUrl(webhookUrl);

    const valid = !!validPreview && !!validContentSync && !!validWebhook;

    this.setState({
      validPreview: validPreview,
      validContentSync: validContentSync,
      validWebhook: validWebhook,
    });

    if (!valid) {
      this.props.sdk.notifier.error('Please review the errors in the form.');

      return false;
    }

    const currentState = await this.props.sdk.app.getCurrentState();

    return {
      parameters: {
        previewUrl,
        contentSyncUrl,
        webhookUrl,
        authToken,
        urlConstructors,
      },
      targetState: enabledContentTypesToTargetState(
        currentState,
        contentTypes,
        enabledContentTypes,
        !!contentSyncUrl
      ),
    };
  };

  updatePreviewUrl = (e) => {
    this.setState({ previewUrl: e.target.value, validPreview: true });
  };

  updateContentSyncUrl = (e) => {
    this.setState({ contentSyncUrl: e.target.value, validContentSync: true });
  };

  updateWebhookUrl = (e) => {
    this.setState({ webhookUrl: e.target.value, validWebhook: true });
  };

  updateAuthToken = (e) => {
    this.setState({ authToken: e.target.value });
  };

  validatePreviewUrl = () => {
    if (this.state.previewUrl) {
      this.setState({ validPreview: isValidUrl(this.state.previewUrl) });
    }
  };

  validateContentSyncUrl = () => {
    if (this.state.contentSyncUrl) {
      this.setState({
        validContentSync: isValidUrl(this.state.contentSyncUrl),
      });
    }
  };

  validateWebhookUrl = () => {
    if (this.state.webhookUrl && !this.state.webhookUrl.startsWith('http')) {
      this.setState({ validWebhook: false });
    }
  };

  selectorTypeToggle = () => {
    this.setState((prevState) => ({
      selectorType: !prevState.selectorType,
    }));
  };

  disableContentType = (id) => {
    const newEnabledTypes = this.state.enabledContentTypes.filter((type) => type !== id);
    const shouldUpdate = this.state.enabledContentTypes.length > newEnabledTypes.length;
    if (shouldUpdate) {
      this.setState(() => ({
        enabledContentTypes: newEnabledTypes,
      }));
    }
  };

  toggleContentType = (enabledContentTypes, newId, prevId) => {
    if (enabledContentTypes.includes(prevId) && prevId !== newId) {
      //Swap in the new id at the correct index in state to avoid the movement in the UI
      const index = enabledContentTypes.findIndex((id) => id === prevId);
      enabledContentTypes[index] = newId;
      return enabledContentTypes;
    } else {
      return enabledContentTypes.concat([newId]);
    }
  };

  onContentTypeToggle = (newId, prevId) => {
    this.setState((prevState) => ({
      ...prevState,
      enabledContentTypes: this.toggleContentType(prevState.enabledContentTypes, newId, prevId),
    }));
  };

  updateUrlConstructors = (currentUrlConstructors, id, newInput) => {
    let constructors;
    // Check if the constructor needs to be added, or if an id that already exists needs a new slug
    const index = currentUrlConstructors.findIndex((cur) => cur.id === id);
    if (index !== -1) {
      currentUrlConstructors[index].slug = newInput;
      constructors = currentUrlConstructors;
    } else {
      const newConstructor = {
        id,
        slug: newInput,
      };
      constructors = [...currentUrlConstructors, ...[newConstructor]];
    }
    // Filter out constructors that no longer have the app enabled
    return constructors.filter((constructor) => {
      const keep = this.state.enabledContentTypes.findIndex((id) => id === constructor.id) !== -1;
      return keep;
    });
  };

  onSlugInput = (id, input) => {
    this.setState((prevState) => ({
      ...prevState,
      urlConstructors: this.updateUrlConstructors(prevState.urlConstructors, id, input),
    }));
  };

  render() {
    const { contentTypes, enabledContentTypes, urlConstructors, selectorType } = this.state;
    const { sdk } = this.props;
    const {
      ids: { space, environment },
    } = sdk;

    const urlHelpText = 'Please provide a valid URL (It should start with http)';

    return (
      <>
        <div className={styles.background} />
        <div className={styles.body}>
          <div className={styles.section}>
            <Typography>
              <Heading>About Gatsby Cloud</Heading>
              <Paragraph>
                This app connects Gatsby Cloud with your Contentful space so you can preview content
                changes before going live.
              </Paragraph>
            </Typography>
          </div>
          <hr className={styles.splitter} />
          <Typography>
            <Heading>Configure CMS Preview</Heading>
            <Paragraph>Use the Site Settings for your Gatsby Cloud site below.</Paragraph>
            <div className={styles.mainbody}>
              <TextField
                name="webhookUrl"
                id="webhookUrl"
                labelText="Preview Webhook"
                value={this.state.webhookUrl}
                onChange={this.updateWebhookUrl}
                onBlur={this.validateWebhookUrl}
                className={styles.input}
                validationMessage={!this.state.validWebhook ? urlHelpText : ''}
                textInputProps={{
                  type: 'text',
                }}
              />
              <TextField
                name="contentSyncUrl"
                id="contentSyncUrl"
                labelText="Content Sync"
                value={this.state.contentSyncUrl}
                onChange={this.updateContentSyncUrl}
                onBlur={this.validateContentSyncUrl}
                className={styles.input}
                helpText={
                  <span>
                    To set up Content Sync, see the{' '}
                    <TextLink
                      href="http://gatsby.dev/contentful-preview-docs"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      installation instructions
                    </TextLink>
                    .
                  </span>
                }
                /*
                 * @todo ensure that this help text is okay
                 */
                validationMessage={!this.state.validContentSync ? urlHelpText : ''}
                textInputProps={{
                  type: 'text',
                }}
              />
            </div>
            <Accordion>
              <AccordionItem title={<FormLabel>Advanced Settings</FormLabel>}>
                <div className={styles.mainbody}>
                  <TextField
                    name="previewUrl"
                    id="previewUrl"
                    labelText="CMS Preview"
                    value={this.state.previewUrl}
                    onChange={this.updatePreviewUrl}
                    onBlur={this.validatePreviewUrl}
                    className={styles.input}
                    helpText={<span>Copy the URL of CMS Preview from Gatsby Cloud</span>}
                    validationMessage={!this.state.validPreview ? urlHelpText : ''}
                    textInputProps={{
                      type: 'text',
                    }}
                  />
                  <TextField
                    name="authToken"
                    id="authToken"
                    labelText="Authentication Token"
                    value={this.state.authToken}
                    onChange={this.updateAuthToken}
                    className={styles.input}
                    helpText="Optional authentication token for private Gatsby Cloud sites"
                    textInputProps={{
                      type: 'password',
                    }}
                  />
                </div>
                {!this.state.contentSyncUrl && (
                  <ContentTypesPanel
                    space={space}
                    environment={environment}
                    contentTypes={contentTypes}
                    enabledContentTypes={enabledContentTypes}
                    urlConstructors={urlConstructors}
                    onSlugInput={this.onSlugInput}
                    onContentTypeToggle={this.onContentTypeToggle}
                    disableContentType={this.disableContentType}
                    selectorTypeToggle={this.selectorTypeToggle}
                    selectorType={selectorType}
                  />
                )}
              </AccordionItem>
            </Accordion>
          </Typography>
        </div>
        <div className={styles.icon}>
          <GatsbyIcon />
        </div>
      </>
    );
  }
}
