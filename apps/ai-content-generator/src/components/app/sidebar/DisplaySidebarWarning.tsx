import { Box } from '@contentful/f36-components';
import ParametersMissingWarning from '@components/app/sidebar/ParametersMissingWarning';
import BrandProfileMissingWarning from '@components/app/sidebar/BrandProfileMissingWarning';
import { warningMessages } from '@components/app/sidebar/sidebarText';
import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';
import { AiApiErrorType } from '@utils/aiApi/handleAiApiErrors';

const styles = {
  msgWrapper: css({
    marginTop: tokens.spacingM,
  }),
};

interface Props {
  hasBrandProfile: boolean;
  apiError: AiApiErrorType | undefined;
}

const DisplaySidebarWarning = (props: Props) => {
  const { hasBrandProfile, apiError } = props;

  if (apiError) {
    const { status, message } = apiError;

    if (status === 401 || status === 404) {
      return (
        <Box css={styles.msgWrapper}>
          <ParametersMissingWarning
            message={warningMessages.paramsMissing}
            linkSubstring={warningMessages.linkSubstring}
          />
        </Box>
      );
    } else if (status === 500 || status === 503) {
      return (
        <Box css={styles.msgWrapper}>
          <ParametersMissingWarning message={warningMessages.unavailable} />
        </Box>
      );
    } else {
      return (
        <Box css={styles.msgWrapper}>
          <ParametersMissingWarning
            message={`${warningMessages.openAiErrorMessage} ${
              message ?? warningMessages.defaultError
            }`}
          />
        </Box>
      );
    }
  }

  console.log(hasBrandProfile);
  if (!hasBrandProfile) {
    return (
      <Box css={styles.msgWrapper}>
        <BrandProfileMissingWarning
          message={warningMessages.profileMissing}
          linkSubstring={warningMessages.linkSubstring}
        />
      </Box>
    );
  }

  return null;
};

export default DisplaySidebarWarning;
