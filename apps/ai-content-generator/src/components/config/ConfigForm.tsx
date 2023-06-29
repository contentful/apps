import { Box, Flex, Form } from '@contentful/f36-components';
import { useReducer } from 'react';
import * as configComponents from './configComponents';
import parameterReducer from './parameterReducer';
import { gptModels } from '@utils/gptModels';
import useSaveConfigHandler from './hooks/useSaveConfigHandler';
import useInitializeParameters from './hooks/useInitializeParameters';

export interface AppInstallationParameters {
  model: string;
  apiKey: string;
  profile: string;
}

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
          <configComponents.APIKey apiKey={parameters.apiKey} dispatch={dispatchParameters} />
          <configComponents.Profile profile={parameters.profile} dispatch={dispatchParameters} />
          <configComponents.Model model={parameters.model} dispatch={dispatchParameters} />
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigForm;
