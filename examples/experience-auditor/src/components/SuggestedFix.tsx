import React from 'react';
import { Box, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

interface SuggestedFixProps {
  /** The proposed value. */
  suggestedValue: string;
  /** Human-readable provenance shown above the value. */
  source: string;
}

/**
 * Read-only advice for a `suggested` finding. The app-sdk surface exposes no
 * host call to write a node's content properties, so the auditor cannot apply
 * the value — it surfaces the derived suggestion for the author to copy across
 * manually. Provenance (`source`) is shown so the author can judge the
 * suggestion before using it.
 */
const SuggestedFix = ({ suggestedValue, source }: SuggestedFixProps) => {
  return (
    <Box
      marginTop="spacingXs"
      padding="spacingXs"
      style={{
        background: tokens.blue100,
        border: `1px dashed ${tokens.blue300}`,
        borderRadius: '5px',
      }}
      data-test-id="suggested-fix">
      <Text fontColor="blue600" fontSize="fontSizeS" fontWeight="fontWeightDemiBold">
        💡 Suggested from {source}
      </Text>
      <Text
        fontColor="gray700"
        fontSize="fontSizeS"
        marginTop="spacing2Xs"
        data-test-id="suggested-value">
        <strong>{suggestedValue}</strong>
      </Text>
    </Box>
  );
};

export default SuggestedFix;
