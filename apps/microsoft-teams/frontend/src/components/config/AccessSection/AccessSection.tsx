import { Dispatch } from 'react';
import { Box, Heading, Paragraph, Subheading } from '@contentful/f36-components';
import { headerSection, accessSection } from '@constants/configCopy';
import { styles } from './AccessSection.styles';
import { ParameterAction } from '@components/config/parameterReducer';
import MsAuthorization from '@components/config/MsAuthorization/MsAuthorization';
import AuthProvider from '@context/AuthProvider';
import { AppInstallationParameters } from '@customTypes/configPage';

interface Props {
  dispatch: Dispatch<ParameterAction>;
  parameters: AppInstallationParameters;
  isAppInstalled: boolean;
}

const AccessSection = (props: Props) => {
  return (
    <Box className={styles.box}>
      <Heading>{headerSection.title}</Heading>
      <Paragraph>{headerSection.description}</Paragraph>
      <hr className={styles.splitter} />
      <Subheading>{accessSection.title}</Subheading>
      <AuthProvider>
        <MsAuthorization {...props} />
      </AuthProvider>
    </Box>
  );
};

export default AccessSection;
