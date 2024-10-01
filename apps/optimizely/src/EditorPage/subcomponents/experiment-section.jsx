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

export default function ExperimentSection(props) {
  const displayNames = new Map();
  if (props.experiments) {
    props.experiments.forEach((experiment) => {
      if (props.isFx) {
        const flagName = experiment.flag_name;
        const ruleKey = experiment.name || experiment.key;
        const environment = experiment.environment_key;
        const onOff = experiment.enabled ? 'on' : 'off';
        const displayName = `${ruleKey} (flag: ${flagName}, environment: ${environment}, ${onOff})`;

        displayNames.set(experiment.id.toString(), displayName);
      } else {
        const displayName = `${experiment.name || experiment.key} (${experiment.status})`;
        displayNames.set(experiment.id.toString(), displayName);
      }
    });
  }
  return (
    <React.Fragment>
      <Heading element="h2" className={styles.heading}>
        Experiment:
      </Heading>
      <FormControl>
        <FormControl.Label>Optimizely experiment</FormControl.Label>
        <Select
          isRequired
          value={props.experiment ? props.experiment.id.toString() : ''}
          onChange={(e) => {
            const value = e.target.value;
            if (value === NOT_SELECTED) {
              props.onChangeExperiment({
                experimentId: '',
                experimentKey: '',
              });
            } else {
              const experiment = props.experiments.find(
                (experiment) => experiment.id.toString() === value
              );
              if (experiment) {
                // props.onChangeExperiment({
                //   experimentId: experiment.id.toString(),
                //   experimentKey: experiment.key.toString(),
                // });
                props.onChangeExperiment(experiment);
              }
            }
          }}
          width="large"
          isDisabled={
            props.hasVariations === true || props.loaded === false || props.reloadNeeded === true
          }
          id="experiment"
          name="experiment">
          {props.loaded === false && (
            <Select.Option value={NOT_SELECTED}>Fetching experiments...</Select.Option>
          )}
          {props.loaded && (
            <React.Fragment>
              <Select.Option value={NOT_SELECTED}>Select Optimizely experiment</Select.Option>
              {props.experiments.map((experiment) => (
                <Select.Option key={experiment.id.toString()} value={experiment.id.toString()}>
                  {displayNames.get(experiment.id.toString())}
                </Select.Option>
              ))}
            </React.Fragment>
          )}
        </Select>
      </FormControl>

      {props.hasVariations === true && !props.reloadNeeded && (
        <Paragraph className={styles.clearDescription}>
          To change experiment, first{' '}
          <TextLink onClick={props.onClearVariations}>clear the content assigned</TextLink>.
        </Paragraph>
      )}
      {props.experiment && props.experiment.description && (
        <Paragraph className={styles.description}>
          Description: {props.experiment.description}
        </Paragraph>
      )}
    </React.Fragment>
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

ExperimentSection.defaultProps = {
  experiments: [],
};
