import React, { useState, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import {  checkAndGetField } from '../util';
import { ProjectType, fieldNames } from '../constants';
import { wait } from '@testing-library/react';

const styles = {
  button: css({
    marginBottom: tokens.spacingS,
  }),
};


const getRuleEditUrl = (projectId, flagKey, ruleKey, environment) => {
  return `https://app.optimizely.com/v2/projects/${projectId}/flags/manage/${flagKey}/rules/${environment}/edit/${ruleKey}`;
};

const getAllFlagsUrl = (projectId, environment) => {
  return `https://app.optimizely.com/v2/projects/${projectId}/flags/list?environment=${environment}`;
};

const getExperimentUrl = (projectId, experimentId) => {
  return `https://app.optimizely.com/v2/projects/${projectId}/experiments/${experimentId}/variations`;
};

const getAllExperimentsUrl = (projectId) => {
  return `https://app.optimizely.com/v2/projects/${projectId}/experiments`;
};

export default function Sidebar(props) {
  const { optimizelyProjectId } = props.sdk.parameters.installation;
  const [projectType, setProjectType] = useState(null);

  const experimentKey = checkAndGetField(props.sdk.entry, fieldNames.experimentKey);
  const experimentId = checkAndGetField(props.sdk.entry, fieldNames.experimentId);
  const flagKey = checkAndGetField(props.sdk.entry, fieldNames.flagKey);
  const environment = checkAndGetField(props.sdk.entry, fieldNames.environment);

  useEffect(() => {
    let isActive = true;

    if (projectType !== null) {
      return;
    }

    const fetchProjectData = async () => {
      const { optimizelyProjectId, optimizelyProjectType } = props.sdk.parameters.installation;
      if (optimizelyProjectType === ProjectType.FeatureExperimentation) {
        setProjectType(ProjectType.FeatureExperimentation);
        return;
      }

      while(isActive && props.client) {
        try {
          const project = await props.client.getProject(optimizelyProjectId);
          if (!isActive) return;
          const type = project.is_flags_enabled ? ProjectType.FeatureExperimentation : ProjectType.FullStack;
          setProjectType(type);
          return;
        } catch (err) {
          await wait(1000);
        }
      }
    };
    fetchProjectData();

    return () => {
      isActive = false;
    }
  }, [props.client, props.sdk, projectType]);

  useEffect(() => {
    props.sdk.window.startAutoResizer();
    return () => {
      props.sdk.window.stopAutoResizer();
    };
  }, [props.sdk.window]);

  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    let unsubscribe = () => {};
    if (props.sdk.entry.fields.revision) {
      unsubscribe = props.sdk.entry.fields.revision.onValueChanged((v) => {
        forceUpdate()
      });
    } else {
      unsubscribe = props.sdk.entry.fields.experimentKey.onValueChanged((v) => {
        forceUpdate()
      });
    }
    return () => {
      return unsubscribe();
    };
  }, [props.sdk.entry, forceUpdate]);

  let disableViewButton = !projectType ||
    (projectType === ProjectType.FullStack && !experimentKey) ||
    (projectType === ProjectType.FeatureExperimentation && (!flagKey || !environment || !experimentKey));

  let disableListButton = !projectType ||
    (projectType === ProjectType.FeatureExperimentation && !environment);

  const isFx = projectType === ProjectType.FeatureExperimentation;

  return (
    <div data-test-id="sidebar">
      <Button
        buttonType="primary"
        isFullWidth
        className={styles.button}
        disabled={disableViewButton}
        href={isFx ? getRuleEditUrl(optimizelyProjectId, flagKey, experimentKey, environment) : getExperimentUrl(optimizelyProjectId, experimentId)}
        target="_blank"
        data-test-id="view-experiment">
        View in Optimizely
      </Button>
      <Button
        buttonType="muted"
        isFullWidth
        className={styles.button}
        disabled={disableListButton}
        target="_blank"
        href={isFx ? getAllFlagsUrl(optimizelyProjectId, environment) : getAllExperimentsUrl(optimizelyProjectId)}
        data-test-id="view-all">
        <>{`View all ${isFx ? 'flags' : 'experiments'}`}</>
      </Button>
    </div>
  );
}

Sidebar.propTypes = {
  sdk: PropTypes.shape({
    entry: PropTypes.shape({
      fields: PropTypes.shape({
        experimentId: PropTypes.object.isRequired,
      }).isRequired,
    }),
    window: PropTypes.object.isRequired,
    parameters: PropTypes.shape({
      installation: PropTypes.shape({
        optimizelyProjectId: PropTypes.string.isRequired,
      }),
    }),
  }).isRequired,
  client: PropTypes.any,
};
