import { ChangeEvent } from 'react';
import {
  Box,
  Flex,
  FormControl,
  Heading,
  HelpText,
  TextInput,
  TextLink,
  Text,
  Badge,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

import { styles } from './AuthenticationSection.styles';
import { AppInstallationParameters } from '@customTypes/configPage';
import { copies } from '@constants/copies';

interface Props {
  parameters: AppInstallationParameters;
  isAppInstalled: boolean;
  handleTokenChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const AuthenticationSection = ({ parameters, isAppInstalled, handleTokenChange }: Props) => {
  const { heading, subheading, input, link, statusMessages } =
    copies.configPage.authenticationSection;

  const renderStatusBadge = () => {
    if (isAppInstalled && parameters.vercelAccessToken && parameters.vercelAccessTokenStatus) {
      return <Badge variant="positive">{statusMessages.valid}</Badge>;
    } else if (!parameters.vercelAccessTokenStatus) {
      return <Badge variant="negative">{statusMessages.invalid}</Badge>;
    } else {
      return <Badge variant="secondary">{statusMessages.notConfigured}</Badge>;
    }
  };
  return (
    <Box className={styles.box}>
      <Heading className={styles.heading}>{heading}</Heading>
      <FormControl id="accessToken" isRequired={true}>
        <FormControl.Label aria-label="accessToken" htmlFor="accessToken">
          {subheading}
        </FormControl.Label>
        <TextInput
          testId="accessToken"
          spellCheck={false}
          name="accessToken"
          type="password"
          placeholder={input.placeholder}
          value={parameters.vercelAccessToken}
          onChange={handleTokenChange}
        />
        <HelpText>
          Follow{' '}
          <TextLink
            icon={<ExternalLinkIcon />}
            alignIcon="end"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer">
            Vercel instructions
          </TextLink>{' '}
          to create an access token for your account.
        </HelpText>
        <Box className={styles.badgeContainer}>
          <Flex fullWidth flexDirection="column">
            <Text fontWeight="fontWeightDemiBold" marginRight="spacing2Xs">
              Status
            </Text>
            <Box>{renderStatusBadge()}</Box>
          </Flex>
        </Box>
      </FormControl>
    </Box>
  );
};
