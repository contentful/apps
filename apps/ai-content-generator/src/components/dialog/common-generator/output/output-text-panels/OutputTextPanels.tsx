import { useContext } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { DialogAppSDK } from '@contentful/app-sdk';
import { GeneratorContext } from '@providers/dialog/common-generator/generatorProvider';
import useEntryAndContentType from '@hooks/dialog/useEntryAndContentType';
import useAI from '@hooks/dialog/useAI';
import GeneratedTextPanel from './generated-text-panel/GeneratedTextPanel';
import OriginalTextPanel from './original-text-panel/OriginalTextPanel';

interface Props {
  ai: ReturnType<typeof useAI>;
  inputText: string;
  outputField: string;
}

const OutputTextPanels = (props: Props) => {
  const { ai, inputText, outputField } = props;
  const { targetLocale, prompt, entryId } = useContext(GeneratorContext);
  const { updateEntry } = useEntryAndContentType(entryId);

  const sdk = useSDK<DialogAppSDK>();

  const handleEntryApply = async () => {
    const fieldKey = outputField.toLocaleLowerCase();
    const fieldLocale = targetLocale;

    const successfullyUpdated = await updateEntry(fieldKey, fieldLocale, ai.output);

    if (successfullyUpdated) {
      sdk.close();
    }
  };

  const generate = async () => {
    try {
      const localeName = sdk.locales.names[targetLocale];
      const userMessage = prompt(inputText, localeName);
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
        hasOutputField={outputField === ''}
        apply={handleEntryApply}
      />
    </>
  );
};

export default OutputTextPanels;
