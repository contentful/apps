/* eslint-disable jsx-a11y/media-has-caption */

import React from 'react';

import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import { Heading, Note, Form, TextField, Paragraph, Typography } from '@contentful/forma-36-react-components';
import MuxLogoSvg from './mux-logo.svg';
import './config.css';

interface ConfigProps {
  sdk: FieldExtensionSDK;
}

class Config extends React.Component<ConfigProps, {}> {
  constructor (props: ConfigProps) {
    super(props);
    this.state = { parameters: {} };

    // `sdk.app` exposes all app-related methods.
    this.app = this.props.sdk.app;

    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    this.app.onConfigure(() => this.onConfigure());
  }

  async componentDidMount () {
    // Get current parameters of the app.
    const parameters = await this.app.getParameters();

    this.setState(
      // If the app is not installed, `parameters` will be `null`.
      // We default to an empty object in this case.
      { parameters: parameters || {} },
      () => {
        // Once preparation has finished, call `setReady` to hide
        // the loading screen and present the app to a user.
        this.app.setReady()
      }
    );
  }

  // Renders the UI of the app.
  render () {
    const { parameters: { muxAccessTokenId, muxAccessTokenSecret } } = this.state;

    return (
      <React.Fragment>
        <div className='config-background' />
        <div className='config-body'>
          <Typography>
            <Heading>About Mux</Heading>
            <Paragraph>
                This app connects to Mux and allows you to upload videos to your content in Contentful.
                After insalling the app ass the component to your content model and you'll get a video uploader in the Contentful UI.
                Your videos will be transcoded, stored and delivered by <a href='https://mux.com'>Mux</a>.
            </Paragraph>
          </Typography>
          <hr className='config-splitter' />
          <Typography>
            <Form id="app-config" spacing="default">
              <Heading>API credentials</Heading>
              <Paragraph>
                These can be obtained by clicking 'Generate new token' in the <a href='https://dashboard.mux.com/settings/access-tokens'>settings on your dashboard</a>. Note that you must be an admin in your Mux account.
              </Paragraph>
              <TextField
                required
                name="mux-access-token"
                id="mux-access-token"
                labelText="Mux access token"
                value={muxAccessTokenId || ''}
                onChange={e => this.setState({ parameters: { muxAccessTokenId: e.target.value, muxAccessTokenSecret } })}
              />
              <TextField
                required
                name="mux-token-secret"
                id="mux-token-secret"
                labelText="Mux token secret"
                value={muxAccessTokenSecret || ''}
                onChange={e => this.setState({ parameters: { muxAccessTokenId, muxAccessTokenSecret: e.target.value } })}
                textInputProps={{type: 'password'}}
              />
            </Form>
          </Typography>
          <hr className='config-splitter' />
          <Paragraph>
            After entering your API credentials, click 'Install' above.
          </Paragraph>
        </div>
        <div className='config-logo-bottom'>
          <img src={MuxLogoSvg} />
        </div>
      </React.Fragment>
    );
  }

  async onConfigure () {
    // Get IDs of all content types in an environment.
    const { items: contentTypes } = await this.props.sdk.space.getContentTypes();
    const contentTypeIds = contentTypes.map(ct => ct.sys.id)

    // Return value of `onConfigure` is used to install
    // or update the configuration.
    return {
      // Parameters to be persisted as the app configuration.
      parameters: this.state.parameters,
      // Transformation of an environment performed in the
      // installation process.
      targetState: {
        EditorInterface: contentTypeIds.reduce((acc, id) => {
          // Insert the app as the first item in sidebars
          // of all content types.
          return { ...acc, [id]: { sidebar: { position: 0 } } }
        }, {})
      }
    };
  }
}

export default Config;
