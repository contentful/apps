import { Button, Flex, Tab } from '@contentful/f36-components';
import { Dispatch, useState } from 'react';
import { GeneratorAction, GeneratorReducer } from '../generatorReducer';

interface Props {
  isNewText: boolean;
  dispatch: Dispatch<GeneratorReducer>;
}

const NewOrExistingText = (props: Props) => {
  const { isNewText, dispatch } = props;

  const changeTextSource = (isNew: boolean) => {
    if (isNew === isNewText) {
      return;
    }

    const type = isNew ? GeneratorAction.IS_NEW_TEXT : GeneratorAction.IS_NOT_NEW_TEXT;
    dispatch({ type });
  };

  return (
    <Flex flexGrow={1} flexDirection="column">
      <Button title="Input custom text" isActive={isNewText} onClick={() => changeTextSource(true)}>
        New Text
      </Button>
      <Button
        title="Use existing text from entry"
        isActive={!isNewText}
        onClick={() => changeTextSource(false)}>
        From Entry
      </Button>
    </Flex>
  );
};

export default NewOrExistingText;
