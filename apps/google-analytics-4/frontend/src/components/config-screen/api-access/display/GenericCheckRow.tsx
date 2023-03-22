import React from 'react';
import { Box, Flex, Text, TextLink } from '@contentful/f36-components';
import { ExternalLinkTrimmedIcon } from '@contentful/f36-icons';
import { CheckListURL } from 'components/config-screen/api-access/display/ServiceAccountChecklist';

type Props = {
  icon: React.ReactNode;
  title: string;
  description: string;
  style: any;
  checkListUrl?: CheckListURL;
};

export default function GenericCheckRow(props: Props) {
  const { icon, title, description, style, checkListUrl } = props;

  return (
    <Box display="flex" style={style}>
      <Flex alignItems="center" justifyContent="space-between" flexGrow={1}>
        <Flex>
          {icon}
          <Text marginRight="spacing2Xs" fontWeight="fontWeightDemiBold">
            {title}
          </Text>
          <Text>- {description}</Text>
        </Flex>
        {checkListUrl && (
          <Flex paddingRight="spacingS">
            <TextLink
              icon={<ExternalLinkTrimmedIcon />}
              alignIcon="end"
              href={checkListUrl.url}
              target="_blank"
              rel="noopener noreferrer">
              {checkListUrl.title}
            </TextLink>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
