import { useContext } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import { GeneratorContext } from '@providers/generatorProvider';
import useEntryAndContentType from '@hooks/dialog/useEntryAndContentType';
import useAI, { GenerateMessage } from '@hooks/dialog/useAI';
import GeneratedTextPanel from './generated-text-panel/GeneratedTextPanel';
import OriginalTextPanel from './original-text-panel/OriginalTextPanel';
import featureConfig from '@configs/features/featureConfig';
import { ContentTypeFieldValidation } from 'contentful-management';
import { SegmentAction, SegmentEvents } from '@configs/segment/segmentEvent';

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
  const { feature, entryId, trackGeneratorEvent } = useContext(GeneratorContext);
  const { updateEntry } = useEntryAndContentType(entryId);

  const sdk = useSDK<DialogAppSDK>();

  const handleEntryApply = async () => {
    const successfullyUpdated = await updateEntry(outputFieldId, outputFieldLocale, ai.output);
    trackGeneratorEvent(SegmentEvents.FLOW_END, SegmentAction.APPLIED);

    if (successfullyUpdated) {
      sdk.notifier.success('Content applied successfully.');
      sdk.close();
    } else {
      sdk.notifier.error('Content did not apply successfully. Please try again.');
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
        outputFieldLocale={outputFieldLocale}
        isNewText={isNewText}
        hasOutputField={Boolean(outputFieldId)}
        hasError={ai.hasError && !ai.output.length}
        dialogText={dialogText}
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
