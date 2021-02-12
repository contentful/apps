import React from 'react';
import PropTypes from 'prop-types';
import { ExtensionUI } from '@gatsby-cloud-pkg/gatsby-cms-extension-base';
import {
  Spinner,
  Paragraph,
  HelpText,
  Icon,
  ValidationMessage
} from '@contentful/forma-36-react-components';

const STATUS_STYLE = { textAlign: 'center', color: '#7f7c82' };
const ICON_STYLE = { marginBottom: '-4px' };

const callWebhook = (webhookUrl, authToken) => fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-preview-update-source': 'contentful-sidebar-extension',
    'x-preview-auth-token': authToken || ''
  },
  body: JSON.stringify({})
});

export default class Sidebar extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {};
    this.sdk = props.sdk;
    this.sdk.entry.onSysChanged(this.onSysChanged);
  }

  onSysChanged = () => {
    if (this.debounceInterval) {
      clearInterval(this.debounceInterval);
    }
    this.debounceInterval = setInterval(this.refreshPreview, 1000);
  };

  componentDidMount() {
    this.sdk.window.startAutoResizer();
  }

  refreshPreview = async () => {
    if (this.debounceInterval) {
      clearInterval(this.debounceInterval);
    }

    const { webhookUrl, authToken } = this.sdk.parameters.installation;

    if (!webhookUrl) {
      return;
    }

    this.setState({ busy: true })

    const [res] = await Promise.all([
      // Convert any errors thrown to non-2xx HTTP response
      // (for uniform handling of errors).
      callWebhook(webhookUrl, authToken).catch(() => ({ ok: false })),
      // Make sure the spinner spins for at least a second
      // (to avoid a blink of text).
      new Promise(resolve => setTimeout(resolve, 1000))
    ]);

    this.setState({ busy: false, ok: res.ok });
  };

  render = async () => {
    const { webhookUrl, previewUrl, authToken, urlConstructors } = this.sdk.parameters.installation;
    const contentSlug = this.sdk.entry.fields.slug;
    const constructor = urlConstructors.find(
      constructor => constructor.id === this.sdk.contentType.sys.id
    )
    console.log(this.sdk)
    // Seperate fields
    const parentFields = constructor.slug.split("/")
    const subFields = parentFields.map(parent => parent.split("."))

    const slug = await Promise.all(subFields.map(async fieldArray => {
      const parentFieldId = this.sdk.entry.fields[fieldArray[0]].getValue().sys.id
      // this.sdk
      const parentEntry = await this.sdk.space.getEntry(parentFieldId)
      const slugPiece = parentEntry.fields[fieldArray[1]][this.sdk.locales.default]
      console.log(slugPiece)
      return slugPiece
    })).toString().replace(/,/i, "/")

    const fullUrl = `${previewUrl}${slug}`
    console.log(fullUrl)




    return (
      <div className="extension">
        <div className="flexcontainer">
          <ExtensionUI
            contentSlug={contentSlug && contentSlug.getValue()}
            previewUrl={previewUrl}
            authToken={authToken}
          />
          {webhookUrl && this.renderRefreshStatus()}
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
            <Spinner />
            {' '}Sending entry data...
          </>
        )}
        {!busy && (ok === true) && (
          <>
            <Icon icon="CheckCircle" color="positive" style={ICON_STYLE} />
            {' '}Entry data in Gatsby up to date!
          </>
        )}
        {!busy && (ok === false) && (
          <>
            <Icon icon="Warning" color="negative" style={ICON_STYLE} />
            {' '}Last update failed.
          </>
        )}
      </HelpText>
    );
  };
}
