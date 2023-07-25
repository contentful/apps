import { Box } from '@contentful/f36-components';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import FeatureButton from './feature-button/FeatureButton';

const SidebarButtons = () => {
  const featureList = Object.entries(featureConfig).map(([featureId]) => {
    return <FeatureButton key={featureId} feature={featureId as AIFeature} />;
  });

  return <Box>{featureList}</Box>;
};

export default SidebarButtons;
