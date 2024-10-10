import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash.get';
import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';
import { Button } from '@contentful/f36-components';

const styles = {
  container: css({
    backgroundColor: tokens.gray100,
    border: `1px solid ${tokens.gray300}`,
    borderBottomLeftRadius: '2px',
    borderBottomRightRadius: '2px',
    borderTop: 'none',
  }),
  row: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacingM,
  }),
  statItemsContainer: css({
    display: 'flex',
  }),
  statItem: css({
    marginRight: tokens.spacingM,
  }),
  statItemValue: css({
    fontSize: tokens.fontSizeXl,
    color: tokens.gray900,
  }),
  statItemLabel: css({
    fontSize: tokens.fontSizeM,
    color: tokens.gray600,
  }),
};

function StatItem(props) {
  return (
    <div className={styles.statItem}>
      <div className={styles.statItemValue}>{props.value}</div>
      <div className={styles.statItemLabel}>{props.label}</div>
    </div>
  );
}

StatItem.propTypes = {
  value: PropTypes.any,
  label: PropTypes.string,
};

function getPercent(value) {
  return (value * 100).toFixed(2);
}

export default function VariationStats(props) {
  const visitorsCount = get(props.experimentResults, [
    'results',
    'reach',
    'variations',
    props.variationId,
    'count',
  ]);
  const visitorsReach = get(props.experimentResults, [
    'results',
    'reach',
    'variations',
    props.variationId,
    'variation_reach',
  ]);
  const url = get(props.experimentResults, ['url']);
  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.statItemsContainer}>
          <StatItem
            value={typeof visitorsCount === 'number' ? visitorsCount : '-'}
            label="visitors"
          />
          <StatItem
            value={typeof visitorsReach === 'number' ? `${getPercent(visitorsReach)}%` : '-'}
            label="visitors"
          />
        </div>
        <Button as="a" variant="secondary" href={url} target="_blank">
          See all results
        </Button>
      </div>
    </div>
  );
}

VariationStats.propTypes = {
  variationId: PropTypes.any,
  experimentResults: PropTypes.shape({
    results: PropTypes.object,
    url: PropTypes.string.isRequired,
  }),
};
