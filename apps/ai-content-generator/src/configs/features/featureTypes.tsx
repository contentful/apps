import { FC } from 'react';
import { AIFeature } from './featureConfig';

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

type FeatureItemBase = {
  title: string;
  helpText: string;
};

interface ComponentFeatureItem extends FeatureItemBase {
  Component: FC<FeatureComponentProps>;
}

interface PromptFeatureItem extends FeatureItemBase {
  prompt: Prompt;
}

/**
 * Feature Config
 */

export type FeatureConfig = {
  [key in AIFeature]: ComponentFeatureItem | PromptFeatureItem;
};
