import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Flex } from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';
import TopLevelHeader from '../components/templates/TopLevelHeader';
import ConfigureAccessInputs from '../components/templates/ConfigureAccessInputs';
import AssignContentTypeDropdown from '../components/templates/AssignContentTypeDropdown';
import SetupRules from '../components/templates/SetupRules';
import Disclaimer from '../components/templates/Disclaimer';

export interface AppInstallationParameters {}

interface Rule {
  id: string;
  column1: string;
  column2: string;
  column3: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();
  const [selectedContentTypes, setSelectedContentTypes] = useState<{ id: string; name: string }[]>(
    []
  );
  const [rules, setRules] = useState<Rule[]>([
    { id: '1', column1: '', column2: '', column3: '' },
    { id: '2', column1: '', column2: '', column3: '' },
    { id: '3', column1: '', column2: '', column3: '' },
  ]);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      fullWidth
      className={css({ padding: '80px 20px' })}>
      <Flex
        flexDirection="column"
        gap="spacing2Xl"
        className={css({ width: '100%', maxWidth: '852px' })}>
        <TopLevelHeader />
        <ConfigureAccessInputs />
        <AssignContentTypeDropdown
          selectedContentTypes={selectedContentTypes}
          setSelectedContentTypes={setSelectedContentTypes}
          sdk={sdk}
        />
        <SetupRules rules={rules} setRules={setRules} />
        <Disclaimer />
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
