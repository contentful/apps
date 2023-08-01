import { useContext } from 'react';
import { GeneratorContext } from '@providers/generatorProvider';
import { Box, Flex, IconButton, Subheading } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { styles } from './Header.styles';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import featureConfig from '@configs/features/featureConfig';
import sparkle from '@components/common/sparkle-icon/sparkle.png';

const Header = () => {
  const sdk = useSDK<DialogAppSDK>();
  const { feature } = useContext(GeneratorContext);
  const title = featureConfig[feature].dialogTitle;

  return (
    <Flex
      data-test-id="dialog-header"
      justifyContent="space-between"
      alignItems="center"
      css={styles.header}>
      <Flex>
        <img src={sparkle}></img>
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
          onClick={() => sdk.close()}
          style={{ padding: 0 }}
        />
      </Box>
    </Flex>
  );
};

export default Header;
