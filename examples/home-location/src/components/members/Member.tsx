import { UserProps } from 'contentful-management';
import { Flex, Text } from '@contentful/f36-components';
import React from 'react';

interface MemberProps {
  member: UserProps;
}

export const Member = ({ member }: MemberProps) => (
  <Flex gap="spacingM" flexDirection="column" alignItems="center">
    <img
      alt={`Avatar of ${member.firstName} ${member.lastName}`}
      style={{
        height: '75px',
        width: '75px',
        borderRadius: '50%',
      }}
      src={member.avatarUrl}
    />
    <Text fontSize="fontSizeL">
      {member.firstName} {member.lastName}
    </Text>
  </Flex>
);
