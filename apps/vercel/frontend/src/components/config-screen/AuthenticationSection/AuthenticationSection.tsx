import { ChangeEvent, useContext } from 'react';
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
import { copies } from '@constants/copies';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { useError } from '@hooks/useError/useError';

interface Props {
  handleTokenChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const AuthenticationSection = ({ handleTokenChange }: Props) => {
  const { title, input, link } = copies.configPage.authenticationSection;
  const { parameters, isLoading, errors } = useContext(ConfigPageContext);
  const authenticationError = errors.authentication;
  const { message, isError } = useError(authenticationError);

  const showError = Boolean(parameters.vercelAccessToken && isError && !isLoading);

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
            Vercel&apos;s instructions
          </TextLink>{' '}
          to create an access token for your account.
        </HelpText>
        {showError && <ValidationMessage>{message}</ValidationMessage>}
      </FormControl>
    </Box>
  );
};
