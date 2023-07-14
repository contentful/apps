import featureConfig, { AIFeature, AIFeatureType } from '@configs/features/featureConfig';
import { FeatureComponentProps } from '@configs/features/featureTypes';
import { FC } from 'react';

const useAIFeature = (aiFeature?: AIFeature): FC<FeatureComponentProps> | null => {
  const featureType = aiFeature ? featureConfig[aiFeature].featureType : null;

  switch (featureType) {
    case AIFeatureType.BASE:
      return () => <div>Test</div>;

    default:
      return null;
  }
};

export default useAIFeature;
