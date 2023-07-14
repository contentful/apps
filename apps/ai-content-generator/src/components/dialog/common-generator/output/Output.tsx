import { Dispatch, useState } from 'react';
import { Flex, Tabs } from '@contentful/f36-components';
import { GeneratorReducer, GeneratorAction } from '../generatorReducer';
import useAI from '@hooks/dialog/useAI';
import OriginalTextPanel from './original-text-panel/OriginalTextPanel';
import GeneratedTextPanel from './generated-text-panel/GeneratedTextPanel';
import { Prompt } from '@configs/features/featureTypes';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';

enum OutputTab {
  ORIGINAL_TEXT = 'original-text',
  GENERATED_TEXT = 'generated-text',
}

interface Props {
  inputText: string;
  locale: string;
  prompt: Prompt;
  dispatch: Dispatch<GeneratorReducer>;
}

const Output = (props: Props) => {
  const { prompt, inputText, locale, dispatch } = props;

  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTab, setCurrentTab] = useState(OutputTab.ORIGINAL_TEXT);

  const sdk = useSDK<DialogAppSDK>();
  const { generateMessage, output, sendStopSignal } = useAI();

  const generate = async () => {
    setIsGenerating(true);
    setCurrentTab(OutputTab.GENERATED_TEXT);

    try {
      const localeName = sdk.locales.names[locale];
      const userMessage = prompt(inputText, localeName);
      const finalOutput = await generateMessage(userMessage, localeName);

      setGeneratedText(finalOutput);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOriginalTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: GeneratorAction.ORIGINAL_TEXT,
      value: event.target.value,
    });
  };

  const handleGeneratedTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGeneratedText(event.target.value);
  };

  return (
    <Flex margin="spacingL" flexGrow={5}>
      <Tabs
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab as OutputTab)}
        style={{ width: '100%' }}>
        <Tabs.List>
          <Tabs.Tab panelId={OutputTab.ORIGINAL_TEXT}> Original Text </Tabs.Tab>
          <Tabs.Tab panelId={OutputTab.GENERATED_TEXT} isDisabled={isGenerating || !generatedText}>
            Generated Text
          </Tabs.Tab>
        </Tabs.List>

        <OriginalTextPanel
          inputText={inputText}
          onFieldChange={handleOriginalTextChange}
          generate={generate}
        />

        <GeneratedTextPanel
          isGenerating={isGenerating}
          inprogressOutputText={output}
          outputText={generatedText}
          onFieldChange={handleGeneratedTextChange}
          generate={generate}
          stopGenerating={sendStopSignal}
        />
      </Tabs>
    </Flex>
  );
};

export default Output;
export { OutputTab };
