import { Box, Heading, Paragraph, Subheading } from '@contentful/f36-components';
import { headerSection, accessSection } from '@constants/configCopy';
import { styles } from './AccessSection.styles';
import MsAuthorization from '@components/config/MsAuthorization/MsAuthorization';
import AuthProvider from '@context/AuthProvider';

const AccessSection = () => {
  return (
    <Box className={styles.box}>
      <Heading>{headerSection.title}</Heading>
      <Paragraph>{headerSection.description}</Paragraph>
      <hr className={styles.splitter} />
      <Subheading>{accessSection.title}</Subheading>
      <AuthProvider>
        <MsAuthorization />
      </AuthProvider>
    </Box>
  );
};

export default AccessSection;
