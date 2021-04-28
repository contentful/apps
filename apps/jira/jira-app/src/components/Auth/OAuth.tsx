import React from 'react';
import { Button, Paragraph } from '@contentful/forma-36-react-components';
import constants from '../../constants';

interface Props {
  setToken: (token: string) => void;
  proactiveWarning?: boolean;
  notifyError: (message: string) => void;
}

export default class OAuth extends React.Component<Props> {
  static defaultProps = {
    proactiveWarning: false
  };

  executeOauth = () => {
    const url = [
      'https://auth.atlassian.com/authorize?',
      'audience=api.atlassian.com',
      `&client_id=${constants.CLIENT_ID}`,
      '&scope=read%3Ajira-user%20read%3Ajira-work%20write%3Ajira-work',
      `&redirect_uri=${encodeURIComponent(constants.OAUTH_REDIRECT_URI)}`,
      '&response_type=code',
      `&state=${encodeURIComponent(window.location.href)}`,
      '&prompt=consent'
    ].join('');

    const oauthWindow = window.open(url, 'Jira Contentful', 'left=150,top=10,width=800,height=900');

    window.addEventListener('message', (e) => {
      if (e.source !== oauthWindow) {
        return ;
      }

      const { token, error } = e.data;

      if (error) {
        this.props.notifyError('There was an error authenticating. Please refresh and try again.');
      } else if (token) {
        this.props.setToken(token);
      }

      if (oauthWindow && (token || error)) {
        oauthWindow.close();
      }
    });
  };

  render() {
    return (
      <div data-test-id="oauth-content">
        {this.props.proactiveWarning && (
          <Paragraph className="paragraph-light">
            Your Jira session will expire soon. Reauthenticate now to continue uninterrupted.
            <br />
            <br />
          </Paragraph>
        )}
        <Button onClick={this.executeOauth} buttonType="primary" isFullWidth testId="oauth-button">
          {this.props.proactiveWarning ? 'Reauthenticate' : 'Connect to Jira'}
        </Button>
      </div>
    );
  }
}
