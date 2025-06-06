import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';

import tokens from '@contentful/f36-tokens';
import { Button, ValidationMessage } from '@contentful/f36-components';

import { normalizeMessage, isOutOfOrder, isDuplicate, messageToState } from './message-processor';
import { createPubSub } from './pubnub-client';

import { EVENT_TRIGGERED, EVENT_TRIGGER_FAILED } from '../constants';

const styles = {
  info: css({
    color: tokens.gray600,
    marginTop: tokens.spacingS,
    marginBottom: tokens.spacingM,
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightNormal,
  }),
  header: css({
    display: 'flex',
    marginBottom: tokens.spacingS,
  }),
};

export default class NeflifySidebarBuildButton extends React.Component {
  static propTypes = {
    site: PropTypes.object.isRequired,
    users: PropTypes.arrayOf(PropTypes.object.isRequired).isRequired,
    userId: PropTypes.string.isRequired,
  };

  state = { history: [] };
  buildTimeoutId = null;

  componentDidMount() {
    this.createPubSub();
  }

  componentWillUnmount() {
    if (this.pubsub) {
      this.pubsub.stop();
    }
    this.clearBuildTimeout();
  }

  clearBuildTimeout = () => {
    if (this.buildTimeoutId) {
      clearTimeout(this.buildTimeoutId);
      this.buildTimeoutId = null;
    }
  };

  startBuildTimeout = () => {
    this.clearBuildTimeout();
    this.buildTimeoutId = setTimeout(() => {
      this.setState({
        buildTimedOut: true,
        ok: false,
        info: 'Contentful lost connection to update the build status. Verify if the build has completed in the Netlify app.',
      });
    }, 120000); // 2 minute timeout for the "Triggering..." button
  };

  createPubSub = async () => {
    const { site } = this.props;

    if (!site.name || !site.netlifySiteId || !site.buildHookId) {
      this.setState({ misconfigured: true });
      return;
    }

    this.pubsub = createPubSub(
      site.netlifySiteId + site.buildHookId,
      normalizeMessage.bind(null, site.netlifySiteId, this.props.users)
    );

    this.pubsub.addListener((msg) => {
      const inOrder = !isOutOfOrder(msg, this.state.history);
      const notDuplicate = !isDuplicate(msg, this.state.history);

      if (inOrder && notDuplicate) {
        const newState = messageToState(msg);

        // Clear timeout after receiving a message indicating we are not stuck on triggering
        this.clearBuildTimeout();

        this.setState(({ history }) => {
          return {
            history: [msg].concat(history),
            buildTimedOut: false,
            ...newState,
          };
        });
      }
    });

    await this.pubsub.start();

    const history = await this.pubsub.getHistory();
    const filteredHistory = history
      .filter((msg, i, history) => !isOutOfOrder(msg, history.slice(i + 1)))
      .filter((msg, i, history) => !isDuplicate(msg, history.slice(i + 1)));

    if (filteredHistory.length > 0) {
      const latestMessage = filteredHistory[0];
      const messageState = messageToState(latestMessage);

      // Check if the latest message is in a stale busy state (older than 10 minutes)
      const isStale = this.isMessageStale(latestMessage, 10 * 60 * 1000); // 10 minutes
      const isStuck = messageState.busy && isStale;

      if (isStuck) {
        // Ignore stale busy message and reset to fresh state
        this.setState({
          history: filteredHistory,
          busy: false,
          status: null,
          info: null,
          ok: true,
        });
      } else {
        // Apply the latest message state normally
        this.setState({
          history: filteredHistory,
          ...messageState,
        });
      }
    }

    this.setState({ ready: true });
  };

  build = async () => {
    this.setState({ buildTimedOut: false });

    this.pubsub.publish({
      contentful: true,
      event: EVENT_TRIGGERED,
      userId: this.props.userId,
    });

    // Start timeout after publishing the trigger event
    this.startBuildTimeout();

    const { buildHookId } = this.props.site;
    const buildHookUrl = `https://api.netlify.com/build_hooks/${buildHookId}`;

    try {
      const res = await fetch(buildHookUrl, { method: 'POST' });

      if (!res.ok) {
        this.clearBuildTimeout();
        this.pubsub.publish({
          contentful: true,
          event: EVENT_TRIGGER_FAILED,
        });
      }
    } catch (error) {
      this.clearBuildTimeout();
      this.pubsub.publish({
        contentful: true,
        event: EVENT_TRIGGER_FAILED,
      });
    }
  };

  resetBuild = () => {
    this.clearBuildTimeout();
    this.setState({
      busy: false,
      buildTimedOut: false,
      status: null,
      info: null,
      ok: true,
    });
  };

  // Check if a message is older than the given threshold (in milliseconds)
  isMessageStale = (message, thresholdMs) => {
    if (!message.t) return false;
    const messageAge = Date.now() - message.t.getTime();
    return messageAge > thresholdMs;
  };

  render() {
    const { ready, busy, status, misconfigured, info, ok, buildTimedOut } = this.state;

    return (
      <div className={styles.body}>
        <Button
          variant="primary"
          isDisabled={!ready || busy}
          isLoading={busy}
          isFullWidth
          onClick={this.build}>
          {busy && status ? status : 'Build website'}
        </Button>
        {buildTimedOut && (
          <div className={styles.info}>
            <ValidationMessage>{info}</ValidationMessage>
            <div style={{ marginTop: tokens.spacingS }}>
              <Button variant="secondary" size="small" onClick={this.resetBuild}>
                Reset build status
              </Button>
            </div>
          </div>
        )}
        {misconfigured && (
          <div className={styles.info}>
            <ValidationMessage>Check Netlify App configuration!</ValidationMessage>
          </div>
        )}
        {info && !buildTimedOut && (
          <div className={styles.info}>
            {ok && info}
            {!ok && <ValidationMessage>{info}</ValidationMessage>}
          </div>
        )}
      </div>
    );
  }
}
