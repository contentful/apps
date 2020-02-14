import * as React from 'react';
import debounce from 'lodash/debounce';
import { render } from 'react-dom';
import {
  init,
  locations,
  AppExtensionSDK,
  SidebarExtensionSDK
} from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';
import AppConfig from './AppConfig';

import Analytics from './Analytics';
import { SidebarExtensionState, SidebarExtensionProps, Gapi, SavedParams } from './typings';
import styles from './styles';
import { Paragraph, TextLink } from '@contentful/forma-36-react-components';
import { docsUrl } from './utils';

export class SidebarExtension extends React.Component<
  SidebarExtensionProps,
  SidebarExtensionState
> {
  state: SidebarExtensionState;

  constructor(props: SidebarExtensionProps) {
    super(props);

    this.state = {
      isAuthorized: props.gapi.analytics.auth.isAuthorized(),
      helpText: new URLSearchParams(window.location.search).get('helpText') || '',
      ...this.getEntryStateFields()
    };
  }

  componentDidMount() {
    const { sdk, gapi } = this.props;
    const { auth } = gapi.analytics;

    sdk.window.startAutoResizer();

    auth.on('signIn', () => this.setState({ isAuthorized: true, helpText: '' }));
    auth.on('signOut', () => {
      const { helpText } = this.state
      window.location.search = helpText && `?helpText=${encodeURIComponent(helpText)}`
    });

    this.props.sdk.entry.onSysChanged(
      debounce(() => {
        this.setState(this.getEntryStateFields());
      }, 500)
    );
  }

  getEntryStateFields() {
    const { entry, contentType, parameters } = this.props.sdk;
    const contentTypeParams = (parameters.installation as SavedParams).contentTypes[contentType.sys.id]
    const contentTypeName = contentType.name

    if (!contentTypeParams) {
      return { isContentTypeConfigured: false, hasSlug: false, pagePath: '', contentTypeName }
    }

    const { urlPrefix, slugField } = contentTypeParams;
    const hasSlug = slugField in entry.fields;

    const pagePath = hasSlug
      ? `${urlPrefix || ''}${entry.fields[slugField].getValue() || ''}`
      : '';

    return {
      isContentTypeConfigured: true,
      hasSlug,
      pagePath,
      contentTypeName,
    };
  }

  render() {
    const { isAuthorized, isContentTypeConfigured, pagePath, hasSlug, contentTypeName, helpText } = this.state;
    const { parameters, entry, notifier } = this.props.sdk;
    const { clientId, viewId } = parameters.installation as SavedParams;

    const helpTextFrag = helpText && <>
      <div className={styles.spaced}/>
      <Paragraph className={styles.lightText}>
      {helpText}. See <TextLink href={docsUrl}>this app&apos;s docs</TextLink> for help.
      </Paragraph>
        </>

    if (!isAuthorized) {
      const renderAuthButton = async (authButton: HTMLDivElement) => {
        try {
          this.props.gapi.analytics.auth.authorize({
            container: authButton,
            clientid: clientId
          });
        } catch (error) {
          notifier.error("The client ID set in this app's config is invalid");
        }
      };

      return (
        <>
        <div
          ref={renderAuthButton}
          className={isAuthorized ? styles.hidden : styles.signInButton}
        />
        {helpTextFrag}
        </>
      );
    }

    if (!isContentTypeConfigured) {
      return <Paragraph className={styles.lightText}>The {contentTypeName}{' '}
      content type hasn&apos;t been configured for use with this app. It must
      have a field of type short text and must be added to the list of
      content types in this app&apos;s configuration.</Paragraph>;
    }

    if (!hasSlug) {
      return <Paragraph className={styles.lightText}>This {contentTypeName} entry doesn&apos;t have a valid slug field.</Paragraph>;
    }

    if (!entry.getSys().publishedAt) {
      return <Paragraph className={styles.lightText}>This {contentTypeName} entry hasn&apos;t been published.</Paragraph>;
    }

    return (
      <section>
        {helpTextFrag}
        <Analytics
          sdk={this.props.sdk}
          setHelpText={helpText => this.setState({ helpText })}
          gapi={this.props.gapi}
          pagePath={pagePath}
          viewId={viewId}
        />
      </section>
    );
  }
}

init(sdk => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(<AppConfig sdk={sdk as AppExtensionSDK} />, document.getElementById('root'));
  } else {
    render(
      <SidebarExtension
        sdk={sdk as SidebarExtensionSDK}
        gapi={((window as unknown) as { gapi: Gapi }).gapi}
      />,
      document.getElementById('root')
    );
  }
});
