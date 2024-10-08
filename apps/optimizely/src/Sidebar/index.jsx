import React, { useState, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Stack } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/css';
import { checkAndGetField } from '../util';
import { ProjectType, fieldNames } from '../constants';
import { waitFor } from '@testing-library/react';

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

      while (isActive && props.client) {
        try {
          const project = await props.client.getProject(optimizelyProjectId);
          if (!isActive) return;
          const type = project.is_flags_enabled
            ? ProjectType.FeatureExperimentation
            : ProjectType.FullStack;
          setProjectType(type);
          return;
        } catch (err) {
          await waitFor(1000);
        }
      }
    };
    fetchProjectData();

    return () => {
      isActive = false;
    };
  }, [props.client, props.sdk, projectType]);

  useEffect(() => {
    props.sdk.window.startAutoResizer();
    return () => {
      props.sdk.window.stopAutoResizer();
    };
  }, [props.sdk.window]);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    let unsubscribe = () => {};
    if (props.sdk.entry.fields.revision) {
      unsubscribe = props.sdk.entry.fields.revision.onValueChanged((v) => {
        forceUpdate();
      });
    } else {
      unsubscribe = props.sdk.entry.fields.experimentKey.onValueChanged((v) => {
        forceUpdate();
      });
    }
    return () => {
      return unsubscribe();
    };
  }, [props.sdk.entry, forceUpdate]);

  let disableViewButton =
    !projectType ||
    (projectType === ProjectType.FullStack && !experimentKey) ||
    (projectType === ProjectType.FeatureExperimentation &&
      (!flagKey || !environment || !experimentKey));

  let disableListButton =
    !projectType || (projectType === ProjectType.FeatureExperimentation && !environment);

  const isFx = projectType === ProjectType.FeatureExperimentation;
  console.log(
    { optimizelyProjectId, environment, flagKey, experimentKey },
    getRuleEditUrl(optimizelyProjectId, flagKey, experimentKey, environment)
  );

  return (
    <div data-test-id="sidebar">
      <Stack variant="spaced" flexDirection="column">
        <Button
          variant="primary"
          isFullWidth
          isDisabled={disableViewButton}
          href={
            isFx
              ? getRuleEditUrl(optimizelyProjectId, flagKey, experimentKey, environment)
              : getExperimentUrl(optimizelyProjectId, experimentId)
          }
          target="_blank"
          testId="view-experiment">
          View in Optimizely
        </Button>
        <Button
          variant="secondary"
          isFullWidth
          isDisabled={disableListButton}
          target="_blank"
          href={
            isFx
              ? getAllFlagsUrl(optimizelyProjectId, environment)
              : getAllExperimentsUrl(optimizelyProjectId)
          }
          testId="view-all">
          <>{`View all ${isFx ? 'flags' : 'experiments'}`}</>
        </Button>
      </Stack>
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
