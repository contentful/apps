import { useContext } from 'react';
import { Button, Tabs } from '@contentful/f36-components';
import { GeneratorContext } from '@providers/generatorProvider';
import TextFieldWithButtons from '@components/common/text-field-with-buttons/TextFieldWIthButtons';
import { GeneratorAction } from '@components/app/dialog/common-generator/generatorReducer';
import { OutputTab } from '../../Output';
import { DialogText } from '@configs/features/featureTypes';
import { css } from '@emotion/react';

const styles = {
  panel: css({
    flexGrow: 1,
  }),
};

interface Props {
  inputText: string;
  generate: () => void;
  isNewText: boolean;
  hasOutputField: boolean;
  dialogText: DialogText;
}

const OriginalTextPanel = (props: Props) => {
  const { inputText, generate, isNewText, hasOutputField, dialogText } = props;
  const { dispatch } = useContext(GeneratorContext);

  const handleOriginalTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const type = isNewText
      ? GeneratorAction.UPDATE_ORIGINAL_TEXT_PROMPT
      : GeneratorAction.UPDATE_ORIGINAL_TEXT_FIELD;
    dispatch({
      type: type,
      value: event.target.value,
    });
  };

  const isTextAreaDisabled = isNewText ? false : !inputText;
  const isGenerateButtonDisabled = !inputText || !hasOutputField;
  const placeholderText = isNewText ? dialogText.promptPlaceholder : dialogText.fieldPlaceholder;
  const helpText = isNewText ? dialogText.promptHelpText : dialogText.fieldHelpText;

  return (
    <Tabs.Panel id={OutputTab.UPDATE_ORIGINAL_TEXT} css={styles.panel}>
      <TextFieldWithButtons
        inputText={inputText}
        onFieldChange={handleOriginalTextChange}
        isDisabled={isTextAreaDisabled}
        placeholder={placeholderText}
        helpText={isGenerateButtonDisabled ? helpText : ''}>
        <Button onClick={generate} isDisabled={isGenerateButtonDisabled}>
          Generate
        </Button>
      </TextFieldWithButtons>
    </Tabs.Panel>
  );
};

export default OriginalTextPanel;
