import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { FormControl, Heading, Paragraph, Select, TextLink } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ExperimentType } from './prop-types';

const styles = {
  heading: css({
    marginBottom: tokens.spacingL,
  }),
  description: css({
    marginTop: tokens.spacingS,
    color: tokens.gray600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  clearDescription: css({
    marginTop: tokens.spacingXs,
    color: tokens.gray500,
  }),
};

const NOT_SELECTED = '-1';

export default function ExperimentSection({
  loaded,
  reloadNeeded,
  hasVariations,
  isFx,
  experiment,
  experiments = [],
  onChangeExperiment,
  onClearVariations,
}) {
  const displayNames = new Map();
  if (experiments) {
    experiments.forEach((exp) => {
      if (isFx) {
        const flagName = exp.flag_name;
        const ruleKey = exp.name || exp.key;
        const environment = exp.environment_key;
        const onOff = exp.enabled ? 'on' : 'off';
        const displayName = `${ruleKey} (flag: ${flagName}, environment: ${environment}, ${onOff})`;

        displayNames.set(exp.id.toString(), displayName);
      } else {
        const displayName = `${exp.name || exp.key} (${exp.status})`;
        displayNames.set(exp.id.toString(), displayName);
      }
    });
  }
  return (
    <>
      <Heading element="h2" className={styles.heading}>
        Experiment:
      </Heading>
      <FormControl>
        <FormControl.Label>Optimizely experiment</FormControl.Label>
        <Select
          isRequired
          value={experiment ? experiment.id.toString() : ''}
          onChange={(e) => {
            const value = e.target.value;
            if (value === NOT_SELECTED) {
              onChangeExperiment({
                experimentId: '',
                experimentKey: '',
              });
            } else {
              const selectedExperiment = experiments.find((exp) => exp.id.toString() === value);
              if (selectedExperiment) {
                onChangeExperiment(selectedExperiment);
              }
            }
          }}
          width="large"
          isDisabled={hasVariations === true || loaded === false || reloadNeeded === true}
          id="experiment"
          name="experiment">
          {loaded === false && (
            <Select.Option value={NOT_SELECTED}>Fetching experiments...</Select.Option>
          )}
          {loaded && (
            <>
              <Select.Option value={NOT_SELECTED}>Select Optimizely experiment</Select.Option>
              {experiments.map((exp) => (
                <Select.Option key={exp.id.toString()} value={exp.id.toString()}>
                  {displayNames.get(exp.id.toString())}
                </Select.Option>
              ))}
            </>
          )}
        </Select>
      </FormControl>

      {hasVariations === true && !reloadNeeded && (
        <Paragraph className={styles.clearDescription}>
          To change experiment, first{' '}
          <TextLink onClick={onClearVariations}>clear the content assigned</TextLink>.
        </Paragraph>
      )}
      {experiment && experiment.description && (
        <Paragraph className={styles.description}>Description: {experiment.description}</Paragraph>
      )}
    </>
  );
}

ExperimentSection.propTypes = {
  loaded: PropTypes.bool.isRequired,
  reloadNeeded: PropTypes.bool,
  hasVariations: PropTypes.bool,
  sdk: PropTypes.object.isRequired,
  isFx: PropTypes.bool.isRequired,
  experiment: ExperimentType,
  experiments: PropTypes.arrayOf(ExperimentType.isRequired),
  onChangeExperiment: PropTypes.func.isRequired,
  onClearVariations: PropTypes.func.isRequired,
};
