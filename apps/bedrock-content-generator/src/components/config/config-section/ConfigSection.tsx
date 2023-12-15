import { Dispatch } from 'react';
import { Box, Flex, Form, Subheading } from '@contentful/f36-components';
import APIKey from '../api-key/APIKey';
import Model from '../model/Model';
import { Sections } from '../configText';
import { ParameterReducer } from '../parameterReducer';

interface Props {
  apiKey: string;
  model: string;
  dispatch: Dispatch<ParameterReducer>;
  isApiKeyValid: boolean;
}

const ConfigSection = (props: Props) => {
  const { apiKey, model, dispatch, isApiKeyValid } = props;

  return (
    <Flex flexDirection="column" alignItems="flex-start" fullWidth={true}>
      <Subheading>{Sections.configHeading}</Subheading>
      <Box>
        <Form>
          <APIKey apiKey={apiKey} isInvalid={!isApiKeyValid} dispatch={dispatch} />
          <Model model={model} dispatch={dispatch} />
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigSection;
