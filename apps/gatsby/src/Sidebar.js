import React from 'react';
import PropTypes from 'prop-types';
import { ExtensionUI } from '@gatsby-cloud-pkg/gatsby-cms-extension-base';
import {
  Spinner,
  HelpText,
  Icon,
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

    this.state = {url: props.sdk.parameters.installation.previewUrl};
    this.sdk = props.sdk;
    this.sdk.entry.onSysChanged(this.onSysChanged);
  }

  onSysChanged = () => {
    if (this.debounceInterval) {
      clearInterval(this.debounceInterval);
    }
    this.debounceInterval = setInterval(this.refreshPreview, 1000);
  };

  buildSlug = async () => {
    const {urlConstructors, previewUrl} = this.sdk.parameters.installation;
    //Find the url constructor for the given contentType
    const constructor = urlConstructors ? urlConstructors.find(
      constructor => constructor.id === this.sdk.contentType.sys.id
    ) : undefined;
    // If there is no constructor set the url as the base preview
    if (!constructor){
      return
    }

    //QUESTION: What does the locale object in the sdk look like when there are multiple locales available. Need to account for spaces that have more than one locale, so they can have previews everywhere.

    // Recursive helper to return slug values buried in a chain of references
    const resolveReferenceChain = async (sdk, array, index, parentId) => {
      console.log(sdk)
      // Full entry to access child fields
      const fullParentEntry = await sdk.space.getEntry(parentId)
      // Child field
      const childField = fullParentEntry.fields[array[index + 1]][sdk.locales.default]
      if (Array.isArray(childField)) {
       console.error("Gatsby Preview App: You are trying to search for a slug in a multi reference field. Only single reference fields are searchable with this app. Either change the field to a single reference, or change the field you are searching for in the slug.")
        return ""
      }

      if (index + 2 < array.length) {
        return resolveReferenceChain(sdk, array, (index + 1), childField.sys.id)
      } else {
        return childField
      }
    }
    //Get array of fields to build slug
    const parentFields = constructor.slug.split("/")
    //Get array of subfields if the slug is using references
    const subFields = parentFields.map(parent => parent.split("."))
    //Generate slug
    const slug = await (
      Promise.all(
        subFields.map(async fieldArray => {
          try {
            // If the generated array's length is greater than 1 it means there is reference chain which can be resolved recursively with the resolveReferenceChain function
            if (fieldArray.length > 1) {
              const parentId = this.sdk.entry.fields[fieldArray[0]].getValue().sys.id
              return resolveReferenceChain(this.sdk, fieldArray, 0, parentId)
            } else if(fieldArray[0].includes('"' || "'")) { // Checks for static text
              return fieldArray[0].replace(/['"]/g, "")
            } else { //Field directly on the entry, no use for reference resolver
              return this.sdk.entry.fields[fieldArray[0]].getValue()
            }
          } catch {
            console.error(`Gatsby Preview App: ${fieldArray[0]}, as defined in the slug field for this content type in the Gatsby Preview App, is not a field. Maybe you mistyped it, or maybe you meant it to be a static string in which case you need to surround it in quotes: ${`"${fieldArray[0]}"`}. The open preview button will send users to your site's base url until fixed.`)
          }
        })
      )
    )
    //Make sure the base preview url ends with a /
    const cleanPreviewUrl = previewUrl.charAt(previewUrl.length - 1) === "/" ? previewUrl : `${previewUrl}/`
    
    const fullUrl = `${cleanPreviewUrl}${slug.toString().replace(/,/i, "/")}` 

    this.setState({url: fullUrl})
  }

  async componentDidMount() {
    this.sdk.window.startAutoResizer();
    this.buildSlug()
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

  render =  () => {
    const { webhookUrl, authToken } = this.sdk.parameters.installation;
    return (
      <div className="extension">
        <div className="flexcontainer">
          <ExtensionUI
            previewUrl={this.state.url}
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
