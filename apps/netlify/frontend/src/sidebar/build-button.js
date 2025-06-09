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

  componentDidMount() {
    this.createPubSub();
  }

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
        this.setState(({ history }) => {
          return {
            history: [msg].concat(history),
            staleBuildDetected: false, // Clear warning when new messages arrive
            ...messageToState(msg),
          };
        });
      }
    });

    await this.pubsub.start();

    const history = await this.pubsub.getHistory();
    const cleanHistory = history
      .filter((msg, i, history) => !isOutOfOrder(msg, history.slice(i + 1)))
      .filter((msg, i, history) => !isDuplicate(msg, history.slice(i + 1)));

    let staleTriggeredMessageFound = false;

    // Check if the most recent message is a stale triggered message
    if (cleanHistory.length > 0) {
      const latestMessage = cleanHistory[0];
      if (latestMessage.event === EVENT_TRIGGERED && latestMessage.t) {
        const messageAge = Date.now() - latestMessage.t.getTime();
        const fiveMinutesMs = 5 * 60 * 1000;
        if (messageAge > fiveMinutesMs) {
          // This is a stale triggered message that was never completed
          staleTriggeredMessageFound = true;
        }
      }
    }

    const filteredHistory = cleanHistory.filter((msg) => {
      // Filter out stale "triggered" messages older than 5 minutes
      if (msg.event === EVENT_TRIGGERED && msg.t) {
        const messageAge = Date.now() - msg.t.getTime();
        const fiveMinutesMs = 5 * 60 * 1000;
        if (messageAge > fiveMinutesMs) {
          return false; // Filter out stale triggered message
        }
      }
      return true;
    });

    const stateUpdate = { history: filteredHistory };

    if (filteredHistory.length > 0) {
      Object.assign(stateUpdate, messageToState(filteredHistory[0]));
    }

    // Only show warning if the most recent message was a stale triggered (truly stuck)
    if (staleTriggeredMessageFound) {
      stateUpdate.staleBuildDetected = true;
    }

    this.setState(stateUpdate);

    this.setState({ ready: true });
  };

  componentWillUnmount() {
    if (this.pubsub) {
      this.pubsub.stop();
    }
  }

  build = async () => {
    this.pubsub.publish({
      contentful: true,
      event: EVENT_TRIGGERED,
      userId: this.props.userId,
    });

    const { buildHookId } = this.props.site;
    const buildHookUrl = `https://api.netlify.com/build_hooks/${buildHookId}`;
    const res = await fetch(buildHookUrl, { method: 'POST' });

    if (!res.ok) {
      this.pubsub.publish({
        contentful: true,
        event: EVENT_TRIGGER_FAILED,
      });
    }
  };

  render() {
    const { ready, busy, status, misconfigured, info, ok, staleBuildDetected } = this.state;

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
        {misconfigured && (
          <div className={styles.info}>
            <ValidationMessage>Check Netlify App configuration!</ValidationMessage>
          </div>
        )}
        {staleBuildDetected && (
          <div className={styles.info}>
            <ValidationMessage>
              Contentful lost connection to update the build status. Verify that your last build
              completed successfully in the Netlify app.
            </ValidationMessage>
          </div>
        )}
        {info && (
          <div className={styles.info}>
            {ok && info}
            {!ok && <ValidationMessage>{info}</ValidationMessage>}
          </div>
        )}
      </div>
    );
  }
}
