import React from 'react';
import { Flex, Text } from '@contentful/f36-components';
import { emptyEntryBannerStyles } from './EmptyEntryBanner.styles';

interface EmptyStateProps {
  hasEntries: boolean;
  hasActiveFilters: boolean;
}

export const EmptyEntryBanner: React.FC<EmptyStateProps> = ({ hasEntries, hasActiveFilters }) => {
  if (hasEntries) {
    return null;
  }

  if (hasActiveFilters) {
    return (
      <Flex className={emptyEntryBannerStyles.container}>
        <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
          We couldn't find any matches.
        </Text>
        <Text fontSize="fontSizeM">
          Try adjusting your filters or resetting them to broaden your search.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex className={emptyEntryBannerStyles.container}>
      <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
        No entries found.
      </Text>
      <Text fontSize="fontSizeM">This content type has no entries yet.</Text>
    </Flex>
  );
};
