import React, { useState } from 'react';
import { Box, Button, Flex, Text, TextInput } from '@contentful/f36-components';

interface SuggestedFixProps {
  /** The proposed value, pre-filled and editable. */
  suggestedValue: string;
  /** Human-readable provenance shown above the field. */
  source: string;
  /** Whether the current user may write (mirrors the deterministic Fix gate). */
  canApply: boolean;
  /** True while the write is in flight. */
  isApplying: boolean;
  /** Apply the (possibly edited) value. */
  onApply: (value: string) => void;
}

/**
 * The confirm-step for a `suggested` fix. Unlike a deterministic fix (applied on
 * click), a suggested value is shown in an editable field so the author reviews
 * and adjusts it before it is written. This keeps the app from silently writing
 * an opinionated value.
 */
const SuggestedFix = ({
  suggestedValue,
  source,
  canApply,
  isApplying,
  onApply,
}: SuggestedFixProps) => {
  const [value, setValue] = useState(suggestedValue);

  return (
    <Box
      marginTop="spacingXs"
      padding="spacingXs"
      style={{ background: '#f0f6ff', border: '1px dashed #9cc2f5', borderRadius: '5px' }}
      data-test-id="suggested-fix">
      <Text fontColor="blue600" fontSize="fontSizeS" fontWeight="fontWeightDemiBold">
        💡 Suggested from {source}
      </Text>
      <Flex gap="spacingXs" alignItems="center" marginTop="spacing2Xs">
        <TextInput
          size="small"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          isDisabled={!canApply || isApplying}
          aria-label="Suggested value"
        />
        <Button
          size="small"
          variant="primary"
          isDisabled={!canApply || value.trim().length === 0}
          isLoading={isApplying}
          onClick={() => onApply(value)}>
          Apply
        </Button>
      </Flex>
      <Text fontColor="gray500" fontSize="fontSizeS" marginTop="spacing2Xs">
        Editable before write · confirms via setContentProperty + notifier
      </Text>
    </Box>
  );
};

export default SuggestedFix;
