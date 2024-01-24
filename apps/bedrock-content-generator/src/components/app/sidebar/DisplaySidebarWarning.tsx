import BrandProfileMissingWarning from "@components/app/sidebar/BrandProfileMissingWarning";
import ParametersMissingWarning from "@components/app/sidebar/ParametersMissingWarning";
import { warningMessages } from "@components/app/sidebar/sidebarText";
import { Box } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/react";
import { AiApiErrorType } from "@utils/aiApi/handleAiApiErrors";

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
    const { message } = apiError;

    // TODO fine-grained errors
    // if (status === 401 || status === 404) {
    //   return (
    //     <Box css={styles.msgWrapper}>
    //       <ParametersMissingWarning
    //         message={warningMessages.paramsMissing}
    //         linkSubstring={warningMessages.linkSubstring}
    //       />
    //     </Box>
    //   );
    // } else if (status === 500 || status === 503) {
    //   return (
    //     <Box css={styles.msgWrapper}>
    //       <ParametersMissingWarning message={warningMessages.unavailable} />
    //     </Box>
    //   );
    // } else {
    return (
      <Box css={styles.msgWrapper}>
        <ParametersMissingWarning
          message={`${warningMessages.BedrockErrorMessage} ${
            message ?? warningMessages.defaultError
          }`}
        />
      </Box>
    );
    // }
  }

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
