/* eslint-disable jsx-a11y/media-has-caption */

import React from 'react';

import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import { Heading, Note, Form, TextField } from '@contentful/forma-36-react-components';
import './config.css'

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
        <div className='form-wrapper'>
          <Form id="app-config" spacing="default">
            <Heading>Mux Video Uploader</Heading>
            <Note noteType="primary" title="About the app">
              A Contentful UI app that makes it simple to add beautiful streaming via <a href='https://mux.com'>Mux</a> to your Contentful project. Install the extension, add the component to your content model, and you're good to go! 🙌
            </Note>
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
            />
          </Form>
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
