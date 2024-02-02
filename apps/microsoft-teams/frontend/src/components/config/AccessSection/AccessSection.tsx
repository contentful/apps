import { ChangeEvent, Dispatch } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  Heading,
  Paragraph,
  Subheading,
  TextInput,
} from '@contentful/f36-components';
import { headerSection, accessSection } from '@constants/configCopy';
import { styles } from './AccessSection.styles';
import { ParameterAction, actions } from '@components/config/parameterReducer';
import TeamsLogo from '@components/config/TeamsLogo/TeamsLogo';
import { HyperLink } from '@contentful/integration-frontend-toolkit/components';
import { useCustomApi } from '@hooks/useCustomApi';
import { AppInstallationParameters } from '@customTypes/configPage';
import { OnConfigureHandler } from '@contentful/app-sdk';

interface Props {
  tenantId: string;
  dispatch: Dispatch<ParameterAction>;
  parameters: AppInstallationParameters;
  handler: OnConfigureHandler;
}

const AccessSection = (props: Props) => {
  const { tenantId, dispatch, parameters, handler } = props;

  const customApi = useCustomApi();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: actions.UPDATE_TENANT_ID,
      payload: e.target.value,
    });
  };

  const handleSave = () => {
    console.log(parameters.tenantId);
    customApi.saveConfiguration({ ...parameters, tenantId: 'abc-123' });

    // customApi.onConfigure(handler);
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
            // TODO: update link to app documentation
            href={'https://www.contentful.com/help/apps-at-contentful/'}
          />
        </Box>
      </Flex>
      <Button onClick={handleSave}>TEST SAVE</Button>
    </Box>
  );
};

export default AccessSection;
