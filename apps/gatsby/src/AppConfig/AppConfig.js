import { get } from "lodash";
import React from "react";
import PropTypes from "prop-types";
import {
  Heading,
  Typography,
  Paragraph,
  TextField,
} from "@contentful/forma-36-react-components";
import GatsbyIcon from "../GatsbyIcon";
import { isValidUrl } from '../utils';
import ContentTypesPanel from "./ContentTypesPanel";
import styles from "../styles";


function editorInterfacesToEnabledContentTypes(eis, appId) {
  const findAppWidget = item => item.widgetNamespace === "app" && item.widgetId === appId;
  return eis
    .filter(ei => !!get(ei, ["sidebar"], []).find(findAppWidget))
    .map(ei => get(ei, ["sys", "contentType", "sys", "id"]))
    .filter(ctId => typeof ctId === "string" && ctId.length > 0);
}

export function enabledContentTypesToTargetState(currentState, contentTypes, enabledContentTypes) {
  return {
    EditorInterface: contentTypes.reduce((acc, ct) => {
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
    enabledContentTypes: {},
    selectorType: false,
    urlConstructors: [],
    previewUrl: "",
    webhookUrl: "",
    contentSyncUrl: "",
    authToken: "",
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
        previewUrl: params.previewUrl || "",
        webhookUrl: params.webhookUrl || "",
        previewWebhookUrl: params.previewWebhookUrl || "",
        contentSyncUrl: params.contentSyncUrl || "",
        authToken: params.authToken || "",
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
      previewWebhookUrl,
      authToken,
    } = this.state;

    this.setState({
      validPreview: true,
      validContentSync: true,
      validWebhook: true,
      validPreviewWebhook: true,
    });

    let valid = true;

    if (!previewUrl || !isValidUrl(previewUrl)) {
      this.setState({ validPreview: false });
      valid = false;
    }

    // the contentSyncUrl is optional but if it is passed, check that it is valid
    if (contentSyncUrl && !isValidUrl(contentSyncUrl)) {
      this.setState({ validContentSync: false });
      valid = false;
    }

    // the webhookUrl is optional but if it is passed, check that it is valid
    if (webhookUrl && !isValidUrl(webhookUrl)) {
      this.setState({ validWebhook: false });
      valid = false;
    }

    // the previewWebhookUrl is optional but if it is passed, check that it is valid
    if (previewWebhookUrl && !isValidUrl(previewWebhookUrl)) {
      this.setState({ validPreviewWebhook: false });
      valid = false;
    }

    if (!valid) {
      this.props.sdk.notifier.error("Please review the errors in the form.");
      return false;
    }
    const currentState = await this.props.sdk.app.getCurrentState();

    return {
      parameters: {
        previewUrl,
        contentSyncUrl,
        webhookUrl,
        previewWebhookUrl,
        authToken,
        urlConstructors,
      },
      targetState: enabledContentTypesToTargetState(
        currentState,
        contentTypes,
        enabledContentTypes
      ),
    };
  };

  updatePreviewUrl = e => {
    this.setState({ previewUrl: e.target.value, validPreview: true });
  };

  updateContentSyncUrl = e => {
    this.setState({ contentSyncUrl: e.target.value, validContentSync: true });
  }

  updateWebhookUrl = e => {
    this.setState({ webhookUrl: e.target.value, validWebhook: true });
  };

  updatePreviewWebhookUrl = e => {
    this.setState({ previewWebhookUrl: e.target.value, validPreviewWebhook: true });
  };

  updateAuthToken = e => {
    this.setState({ authToken: e.target.value });
  };

  validatePreviewUrl = () => {
    if (this.state.previewUrl) {
      this.setState({ validPreview: isValidUrl(this.state.previewUrl) })
    }
  };

  validateContentSyncUrl = () => {
    if (this.state.contentSyncUrl) {
      this.setState({
        validContentSync: isValidUrl(this.state.contentSyncUrl)
      });
    }
  }

  validateWebhookUrl = () => {
    if (this.state.webhookUrl && !this.state.webhookUrl.startsWith("http")) {
      this.setState({ validWebhook: false });
    }
  };

  validatePreviewWebhookUrl = () => {
    if (this.state.previewWebhookUrl) {
      this.setState({
        validPreviewWebhook: isValidUrl(this.state.previewWebhookUrl)
      });
    }
  };

  selectorTypeToggle = () => {
    this.setState(prevState => ({
      selectorType: !prevState.selectorType,
    }));
  };

  disableContentType = id => {
    const newEnabledTypes = this.state.enabledContentTypes.filter(type => type !== id);
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
      const index = enabledContentTypes.findIndex(id => id === prevId);
      enabledContentTypes[index] = newId;
      return enabledContentTypes;
    } else {
      return enabledContentTypes.concat([newId]);
    }
  };

  onContentTypeToggle = (newId, prevId) => {
    this.setState(prevState => ({
      ...prevState,
      enabledContentTypes: this.toggleContentType(prevState.enabledContentTypes, newId, prevId),
    }));
  };

  updateUrlConstructors = (currentUrlConstructors, id, newInput) => {
    let constructors;
    // Check if the constructor needs to be added, or if an id that already exists needs a new slug
    const index = currentUrlConstructors.findIndex(cur => cur.id === id);
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
    return constructors.filter(constructor => {
      const keep = this.state.enabledContentTypes.findIndex(id => id === constructor.id) !== -1;
      return keep;
    });
  };

  onSlugInput = (id, input) => {
    this.setState(prevState => ({
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
                This app connects Gatsby Cloud with your Contentful space so you can preview content changes before going live.
              </Paragraph>
            </Typography>
          </div>
          <hr className={styles.splitter} />
          <Typography>
            <Heading>Site Settings</Heading>
            <Paragraph>Use the Site Settings for your Gatsby Cloud site below.</Paragraph>
            <TextField
              name="previewWebhookUrl"
              id="previewWebhookUrl"
              labelText="Preview Webhook"
              value={this.state.previewWebhookUrl}
              onChange={this.updatePreviewWebhookUrl}
              onBlur={this.validatePreviewWebhookUrl}
              className={styles.input}
              validationMessage={
                !this.state.validPreviewWebhook
                  ? urlHelpText
                  : ""
              }
              textInputProps={{
                type: "text",
              }}
            />
            <TextField
              name="webhookUrl"
              id="webhookUrl"
              labelText="Builds Webhook"
              value={this.state.webhookUrl}
              onChange={this.updateWebhookUrl}
              onBlur={this.validateWebhookUrl}
              className={styles.input}
              validationMessage={
                !this.state.validWebhook
                  ? urlHelpText
                  : ""
              }
              textInputProps={{
                type: "text",
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
              /*
               * @todo ensure that this help text is okay
               */
              validationMessage={
                !this.state.validContentSync
                  ? urlHelpText
                  : ""
              }
              textInputProps={{
                type: "text",
              }}
            />
            <TextField
              name="previewUrl"
              id="previewUrl"
              labelText="CMS Preview"
              value={this.state.previewUrl}
              onChange={this.updatePreviewUrl}
              onBlur={this.validatePreviewUrl}
              className={styles.input}
              helpText={
                <span>
                  Copy the URL of CMS Preview from Gatsby Cloud
                </span>
              }
              validationMessage={
                !this.state.validPreview
                  ? urlHelpText
                  : ""
              }
              textInputProps={{
                type: "text",
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
                type: "password",
              }}
            />
          </Typography>
          {!this.state.contentSyncUrl &&
            <>
              <hr className={styles.splitter} />
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
            </>
          }
        </div>
        <div className={styles.icon}>
          <GatsbyIcon />
        </div>
      </>
    );
  }
}
