import { GeneratorAction } from "@components/app/dialog/common-generator/generatorReducer";
import TextFieldWithButtons from "@components/common/text-field-with-buttons/TextFieldWIthButtons";
import { DialogText } from "@configs/features/featureTypes";
import { tokenWarning } from "@configs/token-warning/tokenWarning";
import { Button, Tabs } from "@contentful/f36-components";
import { css } from "@emotion/react";
import { GeneratorContext } from "@providers/generatorProvider";
import { useContext } from "react";
import { OutputTab } from "../../Output";
// import { SegmentEvents } from '@configs/segment/segmentEvent';
import { errorMessages } from "@components/app/dialog/common-generator/errorMessages";
import AppInstallationParameters from "@components/config/appInstallationParameters";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";

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
  const {
    inputText,
    generate,
    isGenerating,
    isNewText,
    hasOutputField,
    dialogText,
    hasError,
  } = props;
  const { dispatch } = useContext(GeneratorContext);

  const handleGenerate = () => {
    // trackGeneratorEvent(SegmentEvents.GENERATE_CLICKED);
    generate();
  };

  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();

  const handleOriginalTextChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
  const placeholderText = isNewText
    ? dialogText.promptPlaceholder
    : dialogText.fieldPlaceholder;

  const helpText = isNewText
    ? dialogText.promptHelpText
    : dialogText.fieldHelpText;
  const helpTextProps = isGenerateButtonDisabled
    ? { helpText }
    : { warningMessage: tokenWarning };

  return (
    <Tabs.Panel id={OutputTab.UPDATE_ORIGINAL_TEXT} css={styles.panel}>
      <TextFieldWithButtons
        inputText={inputText}
        onFieldChange={handleOriginalTextChange}
        isDisabled={isTextAreaDisabled}
        placeholder={placeholderText}
        hasError={hasError}
        errorMessage={errorMessages.defaultOriginalError}
        {...helpTextProps}
      >
        <Button
          onClick={handleGenerate}
          isDisabled={isGenerateButtonDisabled || isGenerating}
        >
          Generate
        </Button>
      </TextFieldWithButtons>
    </Tabs.Panel>
  );
};

export default OriginalTextPanel;
