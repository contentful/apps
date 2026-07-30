import { Dispatch } from 'react';
import { Box, Flex, Form, Subheading } from '@contentful/f36-components';
import APIKey from '../api-key/APIKey';
import Model from '../model/Model';
import { Sections } from '../configText';
import { ParameterReducer } from '../parameterReducer';

interface Props {
  model: string;
  dispatch: Dispatch<ParameterReducer>;
}

const ConfigSection = (props: Props) => {
  const { model, dispatch } = props;

  return (
    <Flex flexDirection="column" alignItems="flex-start" fullWidth={true}>
      <Subheading>{Sections.configHeading}</Subheading>
      <Box>
        <Form>
          <APIKey dispatch={dispatch} />
          <Model model={model} dispatch={dispatch} />
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigSection;
