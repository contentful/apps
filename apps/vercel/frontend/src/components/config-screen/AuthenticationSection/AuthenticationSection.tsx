import { ChangeEvent } from 'react';
import {
  Box,
  FormControl,
  Heading,
  HelpText,
  TextInput,
  TextLink,
  ValidationMessage,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';

import { styles } from './AuthenticationSection.styles';
import { AppInstallationParameters } from '@customTypes/configPage';
import { copies } from '@constants/copies';

interface Props {
  parameters: AppInstallationParameters;
  isTokenValid: boolean;
  handleTokenChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const AuthenticationSection = ({ parameters, handleTokenChange, isTokenValid }: Props) => {
  const { title, input, link } = copies.configPage.authenticationSection;

  const showError = Boolean(parameters.vercelAccessToken && !isTokenValid);

  return (
    <Box className={styles.box}>
      <Heading className={styles.heading}>{title}</Heading>
      <FormControl id="accessToken" isRequired={true}>
        <FormControl.Label aria-label="accessToken" htmlFor="accessToken">
          {input.label}
        </FormControl.Label>
        <TextInput
          data-testid="access-token"
          spellCheck={false}
          name="accessToken"
          type="password"
          placeholder={input.placeholder}
          value={parameters.vercelAccessToken}
          onChange={handleTokenChange}
          isInvalid={showError}
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
        {showError && <ValidationMessage>{input.errorMessage}</ValidationMessage>}
      </FormControl>
    </Box>
  );
};
