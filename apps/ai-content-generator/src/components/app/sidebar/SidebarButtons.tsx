import { Box } from '@contentful/f36-components';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import FeatureButton from './feature-button/FeatureButton';
import { useState } from 'react';

interface Props {
  shouldDisableButtons: boolean;
}

const SidebarButtons = (props: Props) => {
  const { shouldDisableButtons } = props;
  const [isSaving, setIsSaving] = useState(false);

  const handleSaving = (toggleTo: boolean) => {
    setIsSaving(toggleTo);
  };

  const featureList = Object.keys(featureConfig).map((feature) => {
    return (
      <FeatureButton
        key={feature}
        feature={feature as AIFeature}
        isSaving={isSaving}
        onSaving={handleSaving}
        shouldDisableButtons={shouldDisableButtons}
      />
    );
  });

  return <Box>{featureList}</Box>;
};

export default SidebarButtons;
