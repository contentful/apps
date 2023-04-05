import React, { useCallback } from 'react';
import { Flex, Grid, Text } from '@contentful/f36-components';
import { useAsync } from 'react-async-hook';
import { useCMA } from '@contentful/react-apps-toolkit';
import { Member } from './Member';
import { LoadingMembers } from './LoadingMembers';

const Members = () => {
  const cma = useCMA();
  const getSpaceMembers = useCallback(async () => {
    return await cma.user.getManyForSpace({});
  }, [cma]);

  const { result, loading } = useAsync(getSpaceMembers, []);
  return (
    <Flex
      style={{ width: '900px' }}
      flexDirection="column"
      marginTop="spacing3Xl"
      paddingBottom="spacing2Xl">
      <Text fontColor="blue900" fontSize="fontSize2Xl" fontWeight="fontWeightDemiBold">
        Members of this space:
      </Text>
      {loading ? (
        <Flex marginTop="spacingXl">
          <LoadingMembers />
        </Flex>
      ) : (
        <Grid marginTop="spacingXl" columns="repeat(6, 1fr)" rowGap="spacingM" columnGap="spacingM">
          {result &&
            result.items.map((member) => (
              <Grid.Item key={member.sys.id}>
                <Member member={member} />
              </Grid.Item>
            ))}
        </Grid>
      )}
    </Flex>
  );
};

export default Members;
