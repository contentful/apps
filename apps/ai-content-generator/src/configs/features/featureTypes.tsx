import { AIFeature, AIFeatureType } from './featureConfig';

/**
 * Core Types
 */

export type Prompt = (input: string, targetLocale: string) => string;

export type FeatureComponentProps = {
  entryId: string;
};

/**
 * Feature Items
 */

type FeatureItem = {
  title: string;
  helpText: string;
  prompt: Prompt;
  featureType: AIFeatureType;
};

/**
 * Feature Config
 */

export type FeatureConfig = {
  [key in AIFeature]: FeatureItem;
};
