import { useContext } from "react";
import { GeneratorContext } from "@providers/generatorProvider";
import { Box, Flex, IconButton, Subheading } from "@contentful/f36-components";
import { CloseIcon } from "@contentful/f36-icons";
import { useSDK } from "@contentful/react-apps-toolkit";
import { DialogAppSDK } from "@contentful/app-sdk";
import featureConfig from "@configs/features/featureConfig";
import SparkleFill from "@components/common/sparkle-icon/SparkleFill.svg";
import { css } from "@emotion/react";
import tokens from "@contentful/f36-tokens";

const styles = {
  header: css({
    borderBottom: `1px solid ${tokens.gray300}`,
    padding: `${tokens.spacingXs} ${tokens.spacingL}`,
  }),
  closeButton: css({
    padding: 0,
  }),
};

const Header = () => {
  const sdk = useSDK<DialogAppSDK>();
  const { feature } = useContext(GeneratorContext);
  const title = featureConfig[feature].dialogTitle;

  return (
    <Flex
      data-test-id="dialog-header"
      justifyContent="space-between"
      alignItems="center"
      css={styles.header}
    >
      <Flex>
        <img src={SparkleFill} alt="Sparkle Icon"></img>
        <Subheading marginBottom="none" marginLeft="spacingXs">
          {title}
        </Subheading>
      </Flex>
      <Box>
        <IconButton
          variant="transparent"
          aria-label="Close dialog"
          icon={<CloseIcon />}
          size="large"
          onClick={() => {
            sdk.close();
          }}
          css={styles.closeButton}
        />
      </Box>
    </Flex>
  );
};

export default Header;
