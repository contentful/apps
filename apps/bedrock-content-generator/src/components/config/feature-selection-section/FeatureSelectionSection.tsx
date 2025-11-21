import { Dispatch } from 'react';
import {
  Box,
  Flex,
  FormControl,
  Subheading,
  Paragraph,
  Checkbox,
} from '@contentful/f36-components';
import { Sections } from '../configText';
import { ParameterReducer, ParameterAction } from '../parameterReducer';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import { css } from '@emotion/react';

export const styles = css({
  width: '100%',
  '& > *': {
    marginBottom: '8px',
  },
});

interface Props {
  enabledFeatures: AIFeature[];
  dispatch: Dispatch<ParameterReducer>;
}

const FeatureSelectionSection = ({ enabledFeatures, dispatch }: Props) => {
  const allFeatures = Object.keys(featureConfig) as AIFeature[];

  const handleFeatureToggle = (feature: AIFeature, isChecked: boolean) => {
    if (isChecked) {
      // Remove feature - but prevent if it's the last one
      if (enabledFeatures.length === 1) {
        return; // Prevent removing the last feature
      }
      const updatedFeatures = enabledFeatures.filter((f) => f !== feature);
      dispatch({
        type: ParameterAction.UPDATE_ENABLED_FEATURES,
        value: updatedFeatures,
      });
    } else {
      // Add feature
      const updatedFeatures = [...enabledFeatures, feature];
      dispatch({
        type: ParameterAction.UPDATE_ENABLED_FEATURES,
        value: updatedFeatures,
      });
    }
  };

  const isFeatureEnabled = (feature: AIFeature) => {
    return enabledFeatures.includes(feature);
  };

  return (
    <Flex flexDirection="column" alignItems="flex-start" fullWidth={true}>
      <Subheading>{Sections.featureSelectionHeading}</Subheading>
      <Paragraph>{Sections.featureSelectionDescription}</Paragraph>
      <Box css={styles}>
        <FormControl as="fieldset" marginBottom="none">
          {allFeatures.map((feature) => {
            const featureConfigItem = featureConfig[feature];
            return (
              <Checkbox
                key={feature}
                id={feature}
                isChecked={isFeatureEnabled(feature)}
                onChange={() => handleFeatureToggle(feature, isFeatureEnabled(feature))}
                isDisabled={enabledFeatures.length === 1 && isFeatureEnabled(feature)}>
                {featureConfigItem.buttonTitle}
              </Checkbox>
            );
          })}
        </FormControl>
      </Box>
    </Flex>
  );
};

export default FeatureSelectionSection;
