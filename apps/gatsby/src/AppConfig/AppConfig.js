import { get } from "lodash";
import React from "react";
import PropTypes from "prop-types";
import {
  Heading,
  Typography,
  Paragraph,
  TextField,
  TextLink,
} from "@contentful/forma-36-react-components";
import GatsbyIcon from "../GatsbyIcon";
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
    authToken: "",
    validPreview: true,
    validWebhook: true,
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
      webhookUrl,
      authToken,
    } = this.state;

    this.setState({ validPreview: true, validWebhook: true });

    let valid = true;

    if (!previewUrl) {
      this.setState({ validPreview: false });
      valid = false;
    }

    if (!previewUrl.startsWith("http")) {
      this.setState({ validPreview: false });
      valid = false;
    }

    // the webhookUrl is optional but if it is passed, check that it is valid
    if (webhookUrl && !webhookUrl.startsWith("http")) {
      this.setState({ validWebhook: false });
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
        webhookUrl,
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

  updateWebhookUrl = e => {
    this.setState({ webhookUrl: e.target.value, validWebhook: true });
  };

  updateAuthToken = e => {
    this.setState({ authToken: e.target.value });
  };

  validatePreviewUrl = () => {
    if (!this.state.previewUrl.startsWith("http")) {
      this.setState({ validPreview: false });
    }
  };

  validateWebhookUrl = () => {
    if (this.state.webhookUrl && !this.state.webhookUrl.startsWith("http")) {
      this.setState({ validWebhook: false });
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

    return (
      <>
        <div className={styles.background} />
        <div className={styles.body}>
          <div className={styles.section}>
            <Typography>
              <Heading>About Gatsby Cloud</Heading>
              <Paragraph>
                This app connects to Gatsby Cloud which lets you see updates to your Gatsby site as
                soon as you change content in Contentful. This makes it easy for content creators to
                see changes they make to the website before going live.
              </Paragraph>
            </Typography>
          </div>
          <hr className={styles.splitter} />
          <Typography>
            <Heading>Account Details</Heading>
            <Paragraph>Gatsby Cloud needs a Site URL in order to preview projects.</Paragraph>
            <TextField
              name="previewUrl"
              id="previewUrl"
              labelText="Site URL"
              required
              value={this.state.previewUrl}
              onChange={this.updatePreviewUrl}
              onBlur={this.validatePreviewUrl}
              className={styles.input}
              helpText={
                <span>
                  To get your Site URL, see your{" "}
                  <TextLink
                    href="https://www.gatsbyjs.com/dashboard/sites"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Gatsby dashboard
                  </TextLink>
                  .
                </span>
              }
              validationMessage={
                !this.state.validPreview
                  ? "Please provide a valid URL (It should start with http)"
                  : ""
              }
              textInputProps={{
                type: "text",
              }}
            />
            <TextField
              name="webhookUrl"
              id="webhookUrl"
              labelText="Webhook URL"
              value={this.state.webhookUrl}
              onChange={this.updateWebhookUrl}
              onBlur={this.validateWebhookUrl}
              className={styles.input}
              helpText="Optional Webhook URL. If provided, your site will be automatically rebuilt as you change content."
              validationMessage={
                !this.state.validWebhook
                  ? "Please provide a valid URL (It should start with http)"
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
              helpText="Optional Authentication token for private Gatsby Cloud sites."
              textInputProps={{
                type: "password",
              }}
            />
          </Typography>
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
        </div>
        <div className={styles.icon}>
          <GatsbyIcon />
        </div>
      </>
    );
  }
}
