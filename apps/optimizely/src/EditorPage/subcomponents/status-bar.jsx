import React from 'react';
import { css } from '@emotion/css';
import PropTypes from 'prop-types';
import { Icon } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { Status } from './constants';
import { getEntryStatus } from './utils';
import { CheckCircleIcon, ChevronRightIcon, InfoCircleIcon } from '@contentful/f36-icons';

const styles = {
  note: css({
    marginBottom: tokens.spacingL,
  }),
  container: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1000,
  }),
  item: css({
    display: 'flex',
    alignItems: 'center',
    fontSize: tokens.fontSizeM,
    color: tokens.gray700,
  }),
  itemSeparator: css({
    marginLeft: tokens.spacingM,
    marginRight: tokens.spacingM,
  }),
  itemIcon: css({
    marginRight: tokens.spacingS,
  }),
};

function StatusItem(props) {
  return (
    <div className={styles.item}>
      {props.active ? (
        <CheckCircleIcon className={styles.itemIcon} size="small" variant="positive" />
      ) : (
        <InfoCircleIcon className={styles.itemIcon} size="small" variant="secondary" />
      )}

      <span>{props.children}</span>
    </div>
  );
}

StatusItem.propTypes = {
  children: PropTypes.string,
  active: PropTypes.bool,
};

function StatusSeparator() {
  return <ChevronRightIcon size="small" variant="secondary" />;
}

const checkStatuses = (statuses, experiment, variations, entries, isFx) => {
  if (!experiment) {
    return statuses;
  }

  statuses[Status.SelectExperiment] = true;

  const isRunning = isFx ? experiment.enabled : experiment.status === 'running';
  statuses[Status.StartExperiment] = isRunning;

  if (variations && experiment.variations) {
    const allAdded = variations.length === experiment.variations.length;
    statuses[Status.AddContent] = allAdded;

    if (allAdded) {
      const allVariationsArePublished = variations.reduce((prev, item) => {
        const entry = entries[item.sys.id];
        if (!entry) {
          return prev && false;
        }
        return prev && getEntryStatus(entry.sys) === 'published';
      }, true);

      if (allVariationsArePublished) {
        statuses[Status.PublishVariations] = true;
      }
    }
  }
  return statuses;
};

export default function StatusBar(props) {
  let statuses = {
    [Status.SelectExperiment]: false,
    [Status.StartExperiment]: false,
    [Status.AddContent]: false,
    [Status.PublishVariations]: false,
  };

  if (props.loaded) {
    statuses = checkStatuses(
      statuses,
      props.experiment,
      props.variations,
      props.entries,
      props.isFx
    );
  }

  return (
    <div className={styles.container}>
      <StatusItem active={statuses[Status.SelectExperiment]}>Select experiment</StatusItem>
      <StatusSeparator />
      <StatusItem active={statuses[Status.AddContent]}>Add content</StatusItem>
      <StatusSeparator />
      <StatusItem active={statuses[Status.PublishVariations]}>Publish variations</StatusItem>
      <StatusSeparator />
      <StatusItem active={statuses[Status.StartExperiment]}>Start experiment</StatusItem>
    </div>
  );
}

StatusBar.propTypes = {
  isFx: PropTypes.bool.isRequired,
  loaded: PropTypes.bool.isRequired,
  experiment: PropTypes.object,
  variations: PropTypes.array,
  entries: PropTypes.object,
};
