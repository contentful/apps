const useAIFeatureSwitch = (feature: AIFeatures) => {
  switch (feature) {
    case AIFeatures.TITLE:
      return true;

    case AIFeatures.CONTENT:
      return true;

    case AIFeatures.TRANSLATE:
      return true;

    case AIFeatures.SEO_DESCRIPTION:
      return true;

    case AIFeatures.SEO_KEYWORDS:
      return true;

    default:
      return false;
  }
};
