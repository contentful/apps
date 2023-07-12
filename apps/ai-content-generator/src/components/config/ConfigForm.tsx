import { useReducer } from 'react';
import { Box, Flex, Form } from '@contentful/f36-components';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import gptModels from '@configs/gptModels';
import useInitializeParameters from '@hooks/config/useInitializeParameters';
import useSaveConfigHandler from '@hooks/config/useSaveConfigHandler';
import parameterReducer from './parameterReducer';
import APIKey from './api-key/APIKey';
import Profile from './profile/Profile';
import Model from './model/Model';

const initialParameters: AppInstallationParameters = {
  model: gptModels[0],
  apiKey: '',
  profile: '',
};

const ConfigForm = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);

  useSaveConfigHandler(parameters);
  useInitializeParameters(dispatchParameters);

  return (
    <Flex flexDirection="column" alignItems="center" fullWidth={true}>
      <Box style={{ width: '800px' }} padding={'spacing2Xl'}>
        <Form>
          <APIKey apiKey={parameters.apiKey} dispatch={dispatchParameters} />
          <Profile profile={parameters.profile} dispatch={dispatchParameters} />
          <Model model={parameters.model} dispatch={dispatchParameters} />
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigForm;
export type { AppInstallationParameters };
