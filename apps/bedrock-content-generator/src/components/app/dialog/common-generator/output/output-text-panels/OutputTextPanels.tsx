import featureConfig from "@configs/features/featureConfig";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import useAI, { GenerateMessage } from "@hooks/dialog/useAI";
import useEntryAndContentType from "@hooks/dialog/useEntryAndContentType";
import { GeneratorContext } from "@providers/generatorProvider";
import { ContentTypeFieldValidation } from "contentful-management";
import { useContext } from "react";
import GeneratedTextPanel from "./generated-text-panel/GeneratedTextPanel";
import OriginalTextPanel from "./original-text-panel/OriginalTextPanel";

interface Props {
  onGenerate: (generateMessage: GenerateMessage) => void;
  ai: ReturnType<typeof useAI>;
  inputText: string;
  outputFieldId: string;
  outputFieldLocale: string;
  outputFieldValidation: ContentTypeFieldValidation | null;
  isNewText: boolean;
}

const OutputTextPanels = (props: Props) => {
  const {
    onGenerate,
    ai,
    inputText,
    outputFieldId,
    outputFieldLocale,
    outputFieldValidation,
    isNewText,
  } = props;
  const { feature, entryId } = useContext(GeneratorContext);
  const { updateEntry } = useEntryAndContentType(entryId);
  const sdk = useSDK<DialogAppSDK>();

  const handleEntryApply = async () => {
    const success = await updateEntry(
      outputFieldId,
      outputFieldLocale,
      ai.output,
    );
    if (success) {
      sdk.notifier.success("Content applied successfully.");

      sdk.close();
    } else {
      sdk.notifier.error(
        "Content did not apply successfully. Please try again.",
      );
    }
  };

  const generate = () => {
    onGenerate(ai.generateMessage);
  };

  const dialogText = featureConfig[feature].dialogText;

  return (
    <>
      <OriginalTextPanel
        inputText={inputText}
        generate={generate}
        isGenerating={ai.isGenerating}
        outputFieldLocale={outputFieldLocale}
        isNewText={isNewText}
        hasOutputField={Boolean(outputFieldId)}
        hasError={ai.hasError && !ai.output.length}
        dialogText={dialogText}
        errorText={ai.error?.message}
      />
      <GeneratedTextPanel
        ai={ai}
        generate={generate}
        outputFieldValidation={outputFieldValidation}
        apply={handleEntryApply}
      />
    </>
  );
};

export default OutputTextPanels;
