import { useContext } from 'react';
import { Button, Tabs } from '@contentful/f36-components';
import { GeneratorContext } from '@providers/generatorProvider';
import TextFieldWithButtons from '@components/common/text-field-with-buttons/TextFieldWIthButtons';
import { GeneratorAction } from '@components/app/dialog/common-generator/generatorReducer';
import { OutputTab } from '../../Output';
import { DialogText } from '@configs/features/featureTypes';
import { css } from '@emotion/react';
import { tokenWarning } from '@configs/token-warning/tokenWarning';
import { SegmentEvents } from '@configs/segment/segmentEvent';
import { errorMessages } from '@components/app/dialog/common-generator/errorMessages';
import { DEFAULT_TEXT_LIMIT } from '@configs/ai/gptModels';

const styles = {
  panel: css({
    flexGrow: 1,
  }),
};

interface Props {
  inputText: string;
  generate: () => void;
  isGenerating: boolean;
  isNewText: boolean;
  outputFieldLocale: string;
  hasOutputField: boolean;
  hasError: boolean;
  dialogText: DialogText;
}

const OriginalTextPanel = (props: Props) => {
  const { inputText, generate, isGenerating, isNewText, hasOutputField, dialogText, hasError } =
    props;
  const { dispatch, trackGeneratorEvent } = useContext(GeneratorContext);

  const handleGenerate = () => {
    trackGeneratorEvent(SegmentEvents.GENERATE_CLICKED);
    generate();
  };

  const textLimit = DEFAULT_TEXT_LIMIT;

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
  const textaboveLimit = inputText.length >= (textLimit || Infinity);

  const isGenerateButtonDisabled = !inputText || !hasOutputField;
  const placeholderText = isNewText ? dialogText.promptPlaceholder : dialogText.fieldPlaceholder;

  const helpText = isNewText ? dialogText.promptHelpText : dialogText.fieldHelpText;
  const helpTextProps = isGenerateButtonDisabled ? { helpText } : { warningMessage: tokenWarning };

  return (
    <Tabs.Panel id={OutputTab.UPDATE_ORIGINAL_TEXT} css={styles.panel}>
      <TextFieldWithButtons
        inputText={inputText}
        onFieldChange={handleOriginalTextChange}
        isDisabled={isTextAreaDisabled}
        placeholder={placeholderText}
        hasError={hasError}
        errorMessage={errorMessages.defaultOriginalError}
        sizeValidation={{ max: textLimit }}
        {...helpTextProps}>
        <Button
          onClick={handleGenerate}
          isDisabled={isGenerateButtonDisabled || textaboveLimit || isGenerating}>
          Generate
        </Button>
      </TextFieldWithButtons>
    </Tabs.Panel>
  );
};

export default OriginalTextPanel;
