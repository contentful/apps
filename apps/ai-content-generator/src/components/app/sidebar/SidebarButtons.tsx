import { Box } from '@contentful/f36-components';
import featureConfig, { AIFeature } from '@configs/features/featureConfig';
import FeatureButton from './feature-button/FeatureButton';

const SidebarButtons = () => {
  const featureList = Object.entries(featureConfig).map(([featureId, configItem]) => {
    const { helpText, buttonTitle, title } = configItem;

    return (
      <FeatureButton
        key={featureId}
        text={buttonTitle}
        dialogTitle={title}
        helpText={helpText}
        feature={featureId as AIFeature}
      />
    );
  });

  return <Box>{featureList}</Box>;
};

export default SidebarButtons;
