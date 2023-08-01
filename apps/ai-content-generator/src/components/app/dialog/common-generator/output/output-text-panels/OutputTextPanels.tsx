import { useContext } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import { GeneratorContext } from '@providers/generatorProvider';
import useEntryAndContentType from '@hooks/dialog/useEntryAndContentType';
import useAI from '@hooks/dialog/useAI';
import GeneratedTextPanel from './generated-text-panel/GeneratedTextPanel';
import OriginalTextPanel from './original-text-panel/OriginalTextPanel';
import featureConfig from '@configs/features/featureConfig';

interface Props {
  ai: ReturnType<typeof useAI>;
  inputText: string;
  outputFieldId: string;
  outputFieldLocale: string;
}

const OutputTextPanels = (props: Props) => {
  const { ai, inputText, outputFieldId, outputFieldLocale } = props;
  const { feature, entryId, localeNames } = useContext(GeneratorContext);
  const { updateEntry } = useEntryAndContentType(entryId);

  const sdk = useSDK<DialogAppSDK>();

  const handleEntryApply = async () => {
    const successfullyUpdated = await updateEntry(outputFieldId, outputFieldLocale, ai.output);

    if (successfullyUpdated) {
      sdk.close();
    }
  };

  const generate = async () => {
    try {
      const localeName = localeNames[outputFieldLocale];
      const userMessage = featureConfig[feature].prompt(inputText, localeName);
      await ai.generateMessage(userMessage, localeName);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <OriginalTextPanel inputText={inputText} generate={generate} />
      <GeneratedTextPanel
        ai={ai}
        generate={generate}
        hasOutputField={outputFieldId === ''}
        apply={handleEntryApply}
      />
    </>
  );
};

export default OutputTextPanels;
