import { Box } from '@contentful/f36-components';
import { AIFeature } from '@configs/features/featureConfig';
import FeatureButton from './feature-button/FeatureButton';
import { useState } from 'react';
import useSidebarParameters from '@hooks/sidebar/useSidebarParameters';

const SidebarButtons = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { enabledFeatures } = useSidebarParameters();

  const handleSaving = (toggleTo: boolean) => {
    setIsSaving(toggleTo);
  };

  const featureList = enabledFeatures.map((feature) => {
    return (
      <FeatureButton
        key={feature}
        feature={feature as AIFeature}
        isSaving={isSaving}
        onSaving={handleSaving}
        shouldDisableButtons={false}
      />
    );
  });

  return <Box>{featureList}</Box>;
};

export default SidebarButtons;
