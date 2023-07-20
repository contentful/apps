import { Button, Flex } from '@contentful/f36-components';
import { Dispatch } from 'react';
import { GeneratorAction, GeneratorReducer } from '../generatorReducer';
import { styles } from './NewOrExistingText.styles';

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
      <Button
        className={styles.button}
        title="Input custom text"
        isActive={isNewText}
        onClick={() => changeTextSource(true)}>
        From prompt
      </Button>
      <Button
        title="Use existing text from entry"
        className={styles.button}
        isActive={!isNewText}
        onClick={() => changeTextSource(false)}>
        From field
      </Button>
    </Flex>
  );
};

export default NewOrExistingText;
