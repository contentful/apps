import React from 'react';
import PropTypes from 'prop-types';
import { ExtensionUI } from '@gatsby-cloud-pkg/gatsby-cms-extension-base';

import { Spinner, HelpText, Icon } from '@contentful/forma-36-react-components';

import styled from "@emotion/styled"

export const Button = styled(`button`)`
  border: 0;
  border-radius: 4px;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
  width: 100%;
  color: white;
  background-color: #663399;
  height: 2.5rem;

  ${props => props.disabled ? `
    background-color: grey;
  ` : ``}

  &:hover {
    background-color: #542c85;
    cursor: pointer;
  }
`

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

    this.state = {
      slug: null,
      manifestId: null,
      lastPublishedDateTime: null,
      buttonDisabled: false
    };

    this.sdk = props.sdk;
  }

  async componentDidMount() {
    this.sdk.entry.onSysChanged(this.onSysChanged);
    this.sdk.window.startAutoResizer();

    const content = this.props.sdk.entry.getSys();
    console.log({content})
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
    console.info(`setting manifest id to state ${manifestId}`)
    this.setState({ manifestId });
  }

  setLastPublishedDateTime = (content) => {
    this.setState({
      lastPublishedDateTime: content.publishedAt,
    });
  }

  /**
   * lastPublishedDateTime is used to track when the built in Contentful publish button is clicked
   * and then kick off production builds of the Gatsby site accordingly
   */
  maybeStartProductionBuild = (content) => {
    const { webhookUrl, authToken } = this.sdk.parameters.installation;
    const { lastPublishedDateTime } = this.state;

    /**
     * if these timestamps are equal than the content has not been published OR has not been
     * re-published after changes to the content have been made
     */
    if (!lastPublishedDateTime || lastPublishedDateTime === content.publishedAt) {
      return;
    }

    if (!webhookUrl) {
      /**
       * @todo add this warning to the UI
       */
      console.warn('Warning: Gatsby production build not started since no webhookUrl has been configured.');
      return;
    }

    callWebhook(webhookUrl, authToken);
  }

  onSysChanged = (content) => {
    console.log(`onSysChanged`)
    this.setManifestId(content);
    this.maybeStartProductionBuild(content);
    this.buildSlug();
  };

  // Recursive helper to return slug values buried in a chain of references
  resolveReferenceChain = async (sdk, array, index, parentId) => {
    // Full entry to access child fields
    const fullParentEntry = await sdk.space.getEntry(parentId)
    // Child field
    const childField = fullParentEntry.fields[array[index + 1]][sdk.locales.default]
    if (Array.isArray(childField)) {
      console.error("Gatsby Preview App: You are trying to search for a slug in a multi reference field. Only single reference fields are searchable with this app. Either change the field to a single reference, or change the field you are searching for in the slug.")
      return ""
    }
    if (index + 2 < array.length) {
      return this.resolveReferenceChain(sdk, array, (index + 1), childField.sys.id)
    } else {
      return childField
    }
  }

  buildSlug = async () => {
    const { urlConstructors } = this.sdk.parameters.installation;
    //Find the url constructor for the given contentType
    const constructor = urlConstructors ? urlConstructors.find(
      constructor => constructor.id === this.sdk.contentType.sys.id
    ) : undefined;
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
              return this.resolveReferenceChain(this.sdk, fieldArray, 0, parentId)
            } else if (fieldArray[0].includes('"' || "'")) { // Checks for static text
              return fieldArray[0].replace(/['"]/g, "");
            } else { //Field directly on the entry, no use for reference resolver
              return this.sdk.entry.fields[fieldArray[0]].getValue()
            }
          } catch {
            console.error(`Gatsby Preview App: ${fieldArray[0]}, as defined in the slug field for this content type in the Gatsby Preview App, is not a field. Maybe you mistyped it, or maybe you meant it to be a static string in which case you need to surround it in quotes: ${`"${fieldArray[0]}"`}. The open preview button will send users to your site's base url until fixed.`)
          }
        })
      )
    )

    const finalSlug = slug.join('/')
    this.setState({ slug: finalSlug })
  }

  refreshPreview = () => {
    const {
      webhookUrl,
      previewWebhookUrl,
      authToken
    } = this.sdk.parameters.installation;

    if (previewWebhookUrl) {
      callWebhook(previewWebhookUrl, authToken);
    } else if (webhookUrl) {
      callWebhook(webhookUrl, authToken);
    } else {
      console.warn(`Please add a Preview Webhook URL to your Gatsby Cloud App settings.`)
    }
  };

  getPreviewUrl = () => {
    let {
      previewUrl,
      contentSyncUrl,
    } = this.props.sdk.parameters.installation;
    const { manifestId } = this.state

    if (contentSyncUrl && manifestId) {
      previewUrl = `${contentSyncUrl}/gatsby-source-contentful/${manifestId}`;
    }

    return previewUrl;
  }

  render = () => {
    let {
      contentSyncUrl,
      authToken,
      previewUrl,
      webhookUrl,
      previewWebhookUrl,
    } = this.sdk.parameters.installation;
    const { slug } = this.state

    previewUrl = this.getPreviewUrl();

    return (
      <div className="extension">
        <div className="flexcontainer">
          {(previewWebhookUrl || webhookUrl) ?

            contentSyncUrl ? (
              <>
                <Button disabled={this.state.buttonDisabled} onClick={async () => {
                    if (this.state.buttonDisabled) {
                      return
                    }

                    this.setState({ buttonDisabled: true })
                    // wait a bit for contentful to save.
                    await new Promise(resolve => setTimeout(resolve, 3000))
                    this.refreshPreview();

                    console.log({ previewUrl: this.getPreviewUrl() })

                    let previewUrl = this.getPreviewUrl()
                    console.log(`opening preview url ${previewUrl}`)
                    window.open(previewUrl, `GATSBY`)

                    const interval = setInterval(() => {
                        const newPreviewUrl = this.getPreviewUrl()
                        console.log({previewUrl, newPreviewUrl})

                        if (previewUrl !== newPreviewUrl) {
                          clearInterval(interval)

                          previewUrl = newPreviewUrl

                          console.log(`new preview url ${newPreviewUrl}`)
                          window.open(previewUrl, `GATSBY`)

                          this.refreshPreview();
                          this.setState({ buttonDisabled: false })
                        }
                    }, 1000)

                    setTimeout(() => {
                      clearInterval(interval)
                      this.setState({ buttonDisabled: false })
                    }, 10000)
                }}>
                  {this.state.buttonDisabled ? `Opening Preview` : `Open Preview`}
                </Button>
                {!!this.state.buttonDisabled && <Spinner />}
              </>
            ) : (
              <ExtensionUI
                contentSlug={!contentSyncUrl && !!slug && slug}
                previewUrl={previewUrl}
                authToken={authToken}
                onOpenPreviewButtonClick={async () => {
                  // wait a bit for contentful to save.
                  await new Promise(resolve => setTimeout(resolve, 3000))
                  console.log({ previewUrl: this.getPreviewUrl() })
                  this.refreshPreview();
                  /**
                  * ExtensionUI returns a reference to the opened tab (previewWindow) after eagerly
                  * opening it with the given previewUrl. Because there is a small chance that this will
                  * have a stale manifestId, we update the url in the opened preview tab just in case
                  * to ensure that the user is redirected to the correct preview build
                  */
                  let previewUrl = this.getPreviewUrl()
                  console.log(`opening preview url ${previewUrl}`)
                  window.open(previewUrl, `GATSBY`)
                  const interval = setInterval(() => {
                    const newPreviewUrl = this.getPreviewUrl()
                    console.log({previewUrl, newPreviewUrl})

                    if (previewUrl !== newPreviewUrl) {
                      previewUrl = newPreviewUrl
                      window.open(previewUrl, `GATSBY`)
                      console.log(`new preview url ${newPreviewUrl}`)
                      this.refreshPreview();
                      clearInterval(interval)
                    }
                  }, 1000)

                  setTimeout(() => clearInterval(interval), 10000)
                }}
              />
            )
            :
            <HelpText style={STATUS_STYLE}>
              <Icon icon="Warning" color="negative" style={ICON_STYLE} />
              {' '}Please add a Preview Webhook URL to your Gatsby App settings.
            </HelpText>
          }
        </div>
      </div>
    );
  };
}

