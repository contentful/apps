import { Box } from '@contentful/f36-components';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import FeatureButton from './feature-button/FeatureButton';

const SidebarButtons = () => {
  const featureList = Object.keys(featureConfig).map((feature) => {
    return <FeatureButton key={feature} feature={feature as AIFeature} />;
  });

  return <Box>{featureList}</Box>;
};

export default SidebarButtons;
