import { useContext } from 'react';
import { Button, Tabs } from '@contentful/f36-components';
import { GeneratorContext } from '@providers/generatorProvider';
import TextFieldWithButtons from '@components/common/text-field-with-buttons/TextFieldWIthButtons';
import { GeneratorAction } from '@components/app/dialog/common-generator/generatorReducer';
import { OutputTab } from '../../Output';

interface Props {
  inputText: string;
  generate: () => void;
  isNewText: boolean;
  hasOutputField: boolean;
}

const OriginalTextPanel = (props: Props) => {
  const { inputText, generate, isNewText, hasOutputField } = props;
  const { dispatch } = useContext(GeneratorContext);

  const handleOriginalTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: GeneratorAction.UPDATE_ORIGINAL_TEXT,
      value: event.target.value,
    });
  };

  const isTextAreaDisabled = isNewText ? false : !inputText;
  const isGenerateButtonDisabled = !inputText || !hasOutputField;
  const placeholderText = isNewText ? 'Example prompts...' : 'Directions...';
  const helperText = isGenerateButtonDisabled ? 'Helper text...' : '';

  return (
    <Tabs.Panel id={OutputTab.UPDATE_ORIGINAL_TEXT}>
      <TextFieldWithButtons
        inputText={inputText}
        onFieldChange={handleOriginalTextChange}
        isDisabled={isTextAreaDisabled}
        placeholder={placeholderText}
        helperText={helperText}>
        <Button onClick={generate} isDisabled={isGenerateButtonDisabled}>
          Generate
        </Button>
      </TextFieldWithButtons>
    </Tabs.Panel>
  );
};

export default OriginalTextPanel;
