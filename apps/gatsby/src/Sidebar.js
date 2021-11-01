import React from 'react';
import PropTypes from 'prop-types';
import { ExtensionUI } from '@gatsby-cloud-pkg/gatsby-cms-extension-base';

import { Spinner, HelpText, Icon } from '@contentful/forma-36-react-components';

const STATUS_STYLE = { textAlign: 'center', color: '#7f7c82' };
const ICON_STYLE = { marginBottom: '-4px' };
const GATSBY_PREVIEW_TAB_ID = `GATSBY_TAB`;

const callWebhook = (webhookUrl, authToken) =>
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-preview-update-source': 'contentful-sidebar-extension',
      'x-preview-auth-token': authToken || '',
    },
    body: JSON.stringify({}),
  });

export default class Sidebar extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      slug: null,
      manifestId: null,
      lastPublishedDateTime: null,
      buttonDisabled: false,
    };

    this.sdk = props.sdk;
  }

  async componentDidMount() {
    const { contentSyncUrl } = this.sdk.parameters.installation;

    this.sdk.entry.onSysChanged(contentSyncUrl ? this.onSysChanged : this.legacyOnSysChanged);

    this.sdk.window.startAutoResizer();

    const content = this.props.sdk.entry.getSys();

    this.setManifestId(content);
    this.setLastPublishedDateTime(content);
  }

  /**
   * manifestId is used by the Gatsby Content Sync preview feature to match states of content
   * in Contentful with preview builds on Gatsby Cloud
   */
  setManifestId = (content) => {
    const { id, space, updatedAt } = content;
    const manifestId = `${space.sys.id}-${id}-${updatedAt}`;
    this.setState({ manifestId });
  };

  setLastPublishedDateTime = (content) => {
    this.setState({
      lastPublishedDateTime: content.publishedAt,
    });
  };

  onSysChanged = (content) => {
    this.setManifestId(content);
    this.buildSlug();
  };

  legacyOnSysChanged = () => {
    this.buildSlug();
    if (this.debounceInterval) {
      clearInterval(this.debounceInterval);
    }
    this.debounceInterval = setInterval(this.refreshPreview, 1000);
  };

  // Recursive helper to return slug values buried in a chain of references
  resolveReferenceChain = async (sdk, array, index, parentId) => {
    // Full entry to access child fields
    const fullParentEntry = await sdk.space.getEntry(parentId);
    // Child field
    const childField = fullParentEntry.fields[array[index + 1]][sdk.locales.default];
    if (Array.isArray(childField)) {
      console.error(
        'Gatsby Preview App: You are trying to search for a slug in a multi reference field. Only single reference fields are searchable with this app. Either change the field to a single reference, or change the field you are searching for in the slug.'
      );
      return '';
    }
    if (index + 2 < array.length) {
      return this.resolveReferenceChain(sdk, array, index + 1, childField.sys.id);
    } else {
      return childField;
    }
  };

  buildSlug = async () => {
    const { urlConstructors } = this.sdk.parameters.installation;
    //Find the url constructor for the given contentType
    const constructor = urlConstructors
      ? urlConstructors.find((constructor) => constructor.id === this.sdk.contentType.sys.id)
      : undefined;
    // If there is no constructor set the url as the base preview
    if (!constructor) {
      const { slug } = this.props.sdk.entry.fields;

      if (!slug) {
        /**
         * @todo bolster up how we might handle and warn users/content editors about this
         */
        return;
      }

      const fallbackSlug = await this.props.sdk.entry.fields.slug.getValue();
      this.setState({ slug: fallbackSlug });
      return;
    }

    //Get array of fields to build slug
    const parentFields = constructor.slug.split('/');
    //Get array of subfields if the slug is using references
    const subFields = parentFields.map((parent) => parent.split('.'));
    //Generate slug
    const slug = await Promise.all(
      subFields.map(async (fieldArray) => {
        try {
          // If the generated array's length is greater than 1 it means there is reference chain which can be resolved recursively with the resolveReferenceChain function
          if (fieldArray.length > 1) {
            const parentId = this.sdk.entry.fields[fieldArray[0]].getValue().sys.id;
            return this.resolveReferenceChain(this.sdk, fieldArray, 0, parentId);
          } else if (fieldArray[0].includes('"' || "'")) {
            // Checks for static text
            return fieldArray[0].replace(/['"]/g, '');
          } else {
            //Field directly on the entry, no use for reference resolver
            return this.sdk.entry.fields[fieldArray[0]].getValue();
          }
        } catch {
          console.error(
            `Gatsby Preview App: ${
              fieldArray[0]
            }, as defined in the slug field for this content type in the Gatsby Preview App, is not a field. Maybe you mistyped it, or maybe you meant it to be a static string in which case you need to surround it in quotes: ${`"${fieldArray[0]}"`}. The open preview button will send users to your site's base url until fixed.`
          );
        }
      })
    );

    const finalSlug = slug.join('/');
    this.setState({ slug: finalSlug });
  };

  refreshPreview = () => {
    const { authToken, contentSyncUrl } = this.sdk.parameters.installation;

    if (!contentSyncUrl) {
      this.legacyRefreshPreview();
      return;
    }

    const previewWebhookUrl =
      this.sdk.parameters.installation.previewWebhookUrl ||
      this.sdk.parameters.installation.webhookUrl;

    if (previewWebhookUrl) {
      callWebhook(previewWebhookUrl, authToken);
    } else {
      console.warn(`Please add a Preview Webhook URL to your Gatsby Cloud App settings.`);
    }
  };

  legacyRefreshPreview = async () => {
    if (this.debounceInterval) {
      clearInterval(this.debounceInterval);
    }

    const { webhookUrl, authToken } = this.sdk.parameters.installation;

    if (!webhookUrl) {
      return;
    }

    // calling this during tests will throw errors because we're updating state after the component unmounted
    if (process?.env?.NODE_ENV !== `test`) {
      this.setState({ busy: true });
    }

    const [res] = await Promise.all([
      // Convert any errors thrown to non-2xx HTTP response
      // (for uniform handling of errors).
      callWebhook(webhookUrl, authToken).catch(() => ({ ok: false })),
      // Make sure the spinner spins for at least a second
      // (to avoid a blink of text).
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);

    // calling this during tests will throw errors because we're updating state after the component unmounted
    if (process?.env?.NODE_ENV !== `test`) {
      this.setState({ busy: false, ok: res.ok });
    }
  };

  getPreviewUrl = () => {
    let { previewUrl, contentSyncUrl } = this.props.sdk.parameters.installation;
    const { manifestId } = this.state;

    if (contentSyncUrl && manifestId) {
      previewUrl = `${contentSyncUrl}/gatsby-source-contentful/${manifestId}`;
    }

    return previewUrl;
  };

  handleContentSync = async () => {
    if (this.state.buttonDisabled) {
      return;
    }

    this.setState({ buttonDisabled: true });

    // Contentful takes a few seconds to save. If we do not wait a bit for this, then the Gatsby preview may be started and finish before any content is even saved on the Contentful side
    await new Promise((resolve) => setTimeout(resolve, 3000));

    this.refreshPreview();

    let previewUrl = this.getPreviewUrl();
    console.info(`opening preview url ${previewUrl}`);
    window.open(previewUrl, GATSBY_PREVIEW_TAB_ID);

    // Wait to see if Contentful saves new data async
    const interval = setInterval(() => {
      const newPreviewUrl = this.getPreviewUrl();

      if (previewUrl !== newPreviewUrl) {
        clearInterval(interval);

        previewUrl = newPreviewUrl;

        console.info(`new preview url ${newPreviewUrl}`);
        window.open(previewUrl, GATSBY_PREVIEW_TAB_ID);

        this.refreshPreview();
        this.setState({ buttonDisabled: false });
      }
    }, 1000);

    // after 10 seconds stop waiting for Contentful to save data
    setTimeout(() => {
      clearInterval(interval);
      this.setState({ buttonDisabled: false });
    }, 10000);
  };

  render = () => {
    let { contentSyncUrl, authToken, previewUrl, webhookUrl, previewWebhookUrl } =
      this.sdk.parameters.installation;
    const { slug } = this.state;

    previewUrl = this.getPreviewUrl();

    if (contentSyncUrl && !previewWebhookUrl) {
      return (
        <div className="extension">
          <div className="flexcontainer">
            <HelpText style={STATUS_STYLE}>
              <Icon icon="Warning" color="negative" style={ICON_STYLE} /> Please add a Preview
              Webhook URL to your Gatsby App settings.
            </HelpText>
          </div>
        </div>
      );
    }

    return (
      <div className="extension">
        <div className="flexcontainer">
          <>
            <ExtensionUI
              disabled={this.state.buttonDisabled}
              disablePreviewOpen={!!contentSyncUrl}
              contentSlug={!!slug && slug}
              previewUrl={previewUrl}
              authToken={authToken}
              onOpenPreviewButtonClick={!!contentSyncUrl ? this.handleContentSync : () => {}}
            />
            {!!this.state.buttonDisabled && <Spinner />}
          </>

          {!!webhookUrl && !contentSyncUrl && this.renderRefreshStatus()}
        </div>
      </div>
    );
  };

  renderRefreshStatus = () => {
    const { busy, ok } = this.state;

    return (
      <HelpText style={STATUS_STYLE}>
        {busy && (
          <>
            <Spinner /> Sending entry data...
          </>
        )}
        {!busy && ok === true && (
          <>
            <Icon icon="CheckCircle" color="positive" style={ICON_STYLE} /> Entry data in Gatsby up
            to date!
          </>
        )}
        {!busy && ok === false && (
          <>
            <Icon icon="Warning" color="negative" style={ICON_STYLE} /> Last update failed.
          </>
        )}
      </HelpText>
    );
  };
}
