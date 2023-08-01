import { Box } from '@contentful/f36-components';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import FeatureButton from './feature-button/FeatureButton';
import { useState } from 'react';

const SidebarButtons = () => {
  const [isSaving, setIsSaving] = useState(false);
  const featureList = Object.keys(featureConfig).map((feature) => {
    return (
      <FeatureButton
        key={feature}
        feature={feature as AIFeature}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
      />
    );
  });

  return <Box>{featureList}</Box>;
};

export default SidebarButtons;
