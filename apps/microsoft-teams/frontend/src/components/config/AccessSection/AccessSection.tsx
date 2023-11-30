import { ChangeEvent, Dispatch } from 'react';
import {
  Box,
  Flex,
  FormControl,
  Heading,
  Paragraph,
  Subheading,
  TextInput,
} from '@contentful/f36-components';
import { headerSection, accessSection, appDeepLink } from '@constants/configCopy';
import { styles } from './AccessSection.styles';
import { ParameterAction, actions } from '@components/config/parameterReducer';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { HyperLink } from '@contentful/integration-component-library';

interface Props {
  tenantId: string;
  dispatch: Dispatch<ParameterAction>;
}

const AccessSection = (props: Props) => {
  const { tenantId, dispatch } = props;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: actions.UPDATE_TENANT_ID,
      payload: e.target.value,
    });
  };

  return (
    <Box className={styles.box}>
      <Heading>{headerSection.title}</Heading>
      <Paragraph>{headerSection.description}</Paragraph>
      <hr className={styles.splitter} />
      <Subheading>{accessSection.title}</Subheading>
      <FormControl data-test-id="tenant-id-section">
        <FormControl.Label>{accessSection.fieldName}</FormControl.Label>
        <TextInput value={tenantId} type="text" name="tenantId" onChange={handleChange} />
      </FormControl>
      <Flex marginBottom="spacingS" alignItems="center" className={styles.logo}>
        <TeamsLogo />
        <Box marginLeft="spacingXs">
          <HyperLink
            body={accessSection.teamsAppInfo}
            substring={accessSection.teamsAppLink}
            href={appDeepLink}
          />
        </Box>
      </Flex>
    </Box>
  );
};

export default AccessSection;
