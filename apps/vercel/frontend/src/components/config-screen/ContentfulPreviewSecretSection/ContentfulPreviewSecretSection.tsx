import { ChangeEvent, FocusEvent, useContext } from 'react';
import {
  Box,
  FormControl,
  HelpText,
  TextInput,
  TextLink,
  ValidationMessage,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { styles } from './ContentfulPreviewSecretSection.styles';
import { copies } from '@constants/copies';
import { ConfigPageContext } from '@contexts/ConfigPageProvider';
import { useError } from '@hooks/useError/useError';

interface Props {
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement>) => void;
  handleRetry: () => void;
}

export const ContentfulPreviewSecretSection = ({
  handleChange,
  handleBlur,
  handleRetry,
}: Props) => {
  const { input, docs } = copies.configPage.contentfulPreviewSecretSection;
  const { parameters, isLoading, errors } = useContext(ConfigPageContext);
  const error = errors.contentfulPreviewSecret;
  const { message, isError } = useError({ error });

  const alreadyExistsInVercel =
    error.environmentVariableAlreadyExists && !isLoading && isError;

  const showError = Boolean(
    parameters.vercelAccessToken &&
      isError &&
      !isLoading &&
      !error.environmentVariableAlreadyExists
  );

  return (
    <Box className={styles.box}>
      <FormControl id='previewToken' isRequired={true}>
        <FormControl.Label aria-label='previewToken' htmlFor='previewToken'>
          {input.label}
        </FormControl.Label>
        <TextInput
          data-testid='preview-token'
          spellCheck={false}
          name='previewToken'
          type='text'
          placeholder={input.placeholder}
          value={
            alreadyExistsInVercel ? message : parameters.contentfulPreviewSecret
          }
          onChange={handleChange}
          onBlur={handleBlur}
          isInvalid={showError}
          isDisabled={isLoading || error.environmentVariableAlreadyExists}
        />
        <HelpText>
          This is used to validate requests from Contentful to your Vercel app.
        </HelpText>
        {alreadyExistsInVercel && !parameters.contentfulPreviewSecret && (
          <ValidationMessage>
            Follow{' '}
            <TextLink
              icon={<ExternalLinkIcon />}
              alignIcon='end'
              href={docs.href}
              target='_blank'
              rel='noopener noreferrer'
            >
              Vercel&apos;s instructions
            </TextLink>{' '}
            to remove this environment variable before continuing.{' '}
            <TextLink onClick={handleRetry}>Click to Retry</TextLink>
          </ValidationMessage>
        )}

        {showError && <ValidationMessage>{message}</ValidationMessage>}
      </FormControl>
    </Box>
  );
};
