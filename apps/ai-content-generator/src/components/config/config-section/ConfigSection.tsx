import { Dispatch } from 'react';
import { Box, Flex, Form, Subheading } from '@contentful/f36-components';
import APIKey from '../api-key/APIKey';
import Model from '../model/Model';
import { Sections } from '../configText';
import { ParameterReducer } from '../parameterReducer';

interface Props {
  model: string;
  keyInput: string;
  onKeyChange: (value: string) => void;
  dispatch: Dispatch<ParameterReducer>;
}

const ConfigSection = (props: Props) => {
  const { model, keyInput, onKeyChange, dispatch } = props;

  return (
    <Flex flexDirection="column" alignItems="flex-start" fullWidth={true}>
      <Subheading>{Sections.configHeading}</Subheading>
      <Box>
        <Form>
          <APIKey keyInput={keyInput} onKeyChange={onKeyChange} />
          <Model model={model} dispatch={dispatch} />
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigSection;
