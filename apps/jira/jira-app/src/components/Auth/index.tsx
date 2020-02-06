/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from 'react';
import OAuth from './OAuth';
import JiraClient from '../../jiraClient';
import { Typography, Heading, Paragraph } from '@contentful/forma-36-react-components';

/** Gets the expireTime from local storage to determine if the token is expired */
function tokenIsExpired() {
  const token = window.localStorage.getItem('token') || '';
  const expires = window.localStorage.getItem('expireTime') || '0';

  return !token || !expires || Date.now() > parseInt(expires, 10);
}

function tokenWillExpireSoon() {
  const expires = window.localStorage.getItem('expireTime') || '0';
  const _10Minutes = 600000;

  return !expires || parseInt(expires, 10) - Date.now() <= _10Minutes;
}

function resetLocalStorage() {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('expireTime');
}

interface Props {
  children: (token: string, client: JiraClient, reset: () => void) => JSX.Element | null;
  notifyError: (message: string) => void;
  mode: 'full' | 'config';
  parameters?: InstallationParameters;
  setReady?: () => void;
}

interface State {
  token: string;
  client: JiraClient | null;
  expiresSoon: boolean;
}

/** A wrapper for running the OAuth flow and passing a Jira client to the children */
export default class AuthWrapper extends React.Component<Props, State> {
  private expirationWatchInterval: NodeJS.Timeout | undefined;

  static defaultProps = {
    mode: 'full'
  };

  constructor(props: Props) {
    super(props);

    const token = window.localStorage.getItem('token') || '';
    const params = props.parameters;

    this.state = {
      token,
      client:
        token && params
          ? this.initClient(token, params.projectId, params.resourceId, params.resourceUrl)
          : null,
      expiresSoon: false
    };
  }

  componentDidMount() {
    this.refreshToken();
  }

  initClient = (token: string, projectId: string, cloudId: string, jiraUrl: string) => {
    this.watchForExpiration();
    return new JiraClient(token, projectId, cloudId, jiraUrl, this.resetClientAndToken);
  };

  initialize = (token: string) => {
    if (this.props.mode === 'full' && this.props.parameters && token) {
      const { parameters } = this.props;
      this.setState({
        token,
        expiresSoon: false,
        client: this.initClient(
          token,
          parameters.projectId,
          parameters.resourceId,
          parameters.resourceUrl
        )
      });

      return;
    }

    this.setState({ token });
  };

  resetClientAndToken = () => {
    resetLocalStorage();
    this.setState({ client: null, token: '' });
  };

  refreshToken = () => {
    if (tokenIsExpired()) {
      this.resetClientAndToken();

      if (this.props.setReady) {
        this.props.setReady();
      }
    } else if (tokenWillExpireSoon()) {
      this.setState({ expiresSoon: true });
    }
  };

  clearExpirationInterval() {
    if (this.expirationWatchInterval) {
      clearInterval(this.expirationWatchInterval)
    }
  }

  watchForExpiration = () => {
    this.clearExpirationInterval();
    this.expirationWatchInterval = setInterval(this.refreshToken, 5000);
  };

  componentWillUnmount() {
    this.clearExpirationInterval();
  }

  render() {
    if (!this.state.token) {
      const isConfigMode = this.props.mode === 'config';

      if (isConfigMode) {
        return (
          <Typography>
            <Heading>Connect Jira</Heading>
            <Paragraph>
              Connect your Jira instance to Contentful to enable you and your team to link
              Contentful entires to Jira issues.
            </Paragraph>
            <OAuth setToken={this.initialize} notifyError={this.props.notifyError} />
          </Typography>
        );
      }

      return <OAuth setToken={this.initialize} notifyError={this.props.notifyError} />;
    }

    return (
      <>
        {this.state.expiresSoon && (
          <>
            <OAuth
              setToken={this.initialize}
              proactiveWarning
              notifyError={this.props.notifyError}
            />
            <br />
            <br />
          </>
        )}
        {this.props.children(this.state.token, this.state.client!, this.resetClientAndToken)}
      </>
    );
  }
}
