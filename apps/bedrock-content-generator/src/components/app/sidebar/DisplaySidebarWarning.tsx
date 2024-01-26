import BrandProfileMissingWarning from "@components/app/sidebar/BrandProfileMissingWarning";
import { warningMessages } from "@components/app/sidebar/sidebarText";
import { Box } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/react";

const styles = {
  msgWrapper: css({
    marginTop: tokens.spacingM,
  }),
};

interface Props {
  hasBrandProfile: boolean;
}

const DisplaySidebarWarning = (props: Props) => {
  const { hasBrandProfile } = props;

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
