import React from 'react';
import { Flex, Text } from '@contentful/f36-components';
import { emptyEntryBannerStyles } from './EmptyEntryBanner.styles';

interface EmptyStateProps {
  hasEntries: boolean;
  // hasInitialEntries: boolean;
}

export const EmptyEntryBanner: React.FC<EmptyStateProps> = ({
  hasEntries,
  // hasInitialEntries
}) => {
  if (hasEntries) {
    return null;
  }

  // if (!hasInitialEntries) {
  //   return (
  //     <Flex
  //       alignItems="center"
  //       justifyContent="center"
  //       flexDirection="column"
  //       padding="spacing2Xl"
  //       className={emptyEntryBannerStyles.container}>
  //       <Text fontSize="fontSizeL" fontWeight="fontWeightDemiBold">
  //         No entries found.
  //       </Text>
  //     </Flex>
  //   );
  // }

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
};
