import React, { useCallback } from 'react';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { useAsync } from 'react-async-hook';
import { Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import Stats from '../components/stats/Stats';
import Members from '../components/members/Members';

export const Home = () => {
  const sdk = useSDK();
  const cma = useCMA();
  const getSpace = useCallback(async () => {
    return await cma.space.get({});
  }, [cma]);

  const { result } = useAsync(getSpace, []);

  return (
    <Flex flexDirection="column" alignItems="center" fullWidth>
      <Flex
        justifyContent="center"
        padding="spacing3Xl"
        fullWidth
        style={{ backgroundColor: tokens.gray700 }}>
        <Flex flexDirection="column" gap="spacingXl" style={{ width: '900px' }}>
          <Text fontColor="colorWhite" fontSize="fontSize4Xl" fontWeight="fontWeightDemiBold">
            👋 Welcome back, {sdk.user.firstName}!
          </Text>
          {result && (
            <Text fontColor="colorWhite" fontSize="fontSizeXl" fontWeight="fontWeightDemiBold">
              Space: {result.name}
            </Text>
          )}
        </Flex>
      </Flex>
      <Flex style={{ width: '900px' }} flexDirection="column" marginTop="spacing3Xl">
        <Stats />
        <Members />
      </Flex>
    </Flex>
  );
};

export default Home;
