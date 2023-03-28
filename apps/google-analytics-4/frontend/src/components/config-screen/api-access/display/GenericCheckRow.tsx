import React from 'react';
import { Box, Flex, Text, TextLink } from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon } from '@contentful/f36-icons';
import { ChecklistURL } from 'components/config-screen/api-access/display/ChecklistUtils';

type Props = {
  icon: React.ReactNode;
  title: string;
  description: string;
  checklistUrl?: ChecklistURL;
  disabled: boolean;
  style: any;
};

export default function GenericChecklistRow(props: Props) {
  const { icon, title, description, checklistUrl, disabled, style } = props;

  return (
    <Box display="flex" style={style}>
      <Flex alignItems="center" justifyContent="space-between" flexGrow={1}>
        <Flex alignItems="center">
          {icon}
          <Text
            fontColor={disabled ? 'gray500' : 'gray800'}
            marginRight="spacing2Xs"
            fontWeight={disabled ? 'fontWeightMedium' : 'fontWeightDemiBold'}>
            {title}
          </Text>
          <Text fontColor={disabled ? 'gray500' : 'gray800'}>- {description}</Text>
        </Flex>
        {checklistUrl && (
          <Flex paddingRight="spacingS">
            <TextLink
              icon={<ExternalLinkTrimmedIcon />}
              alignIcon="end"
              href={checklistUrl.url}
              target="_blank"
              rel="noopener noreferrer">
              {checklistUrl.title}
            </TextLink>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
