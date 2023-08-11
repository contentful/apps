import { useEffect, useState } from 'react';
import { Flex, Tabs } from '@contentful/f36-components';
import useAI, { GenerateMessage } from '@hooks/dialog/useAI';
import OutputTextPanels from './output-text-panels/OutputTextPanels';
import { ContentTypeFieldValidation } from 'contentful-management';
import { styles } from './Output.styles';

enum OutputTab {
  UPDATE_ORIGINAL_TEXT = 'original-text',
  GENERATED_TEXT = 'generated-text',
}

interface Props {
  onGenerate: (generateMessage: GenerateMessage) => void;
  inputText: string;
  outputFieldId: string;
  outputFieldLocale: string;
  outputFieldValidation: ContentTypeFieldValidation | null;
  isNewText: boolean;
}

const Output = (props: Props) => {
  const {
    onGenerate,
    inputText,
    outputFieldId,
    outputFieldLocale,
    outputFieldValidation,
    isNewText,
  } = props;
  const ai = useAI();

  const [currentTab, setCurrentTab] = useState(OutputTab.UPDATE_ORIGINAL_TEXT);

  useEffect(() => {
    if (ai.isGenerating) {
      setCurrentTab(OutputTab.GENERATED_TEXT);
    }
  }, [ai.isGenerating]);

  return (
    <Flex css={styles.wrapper}>
      <Tabs
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab as OutputTab)}
        css={styles.tabsContainer}>
        <Tabs.List css={styles.tabsList}>
          <Tabs.Tab panelId={OutputTab.UPDATE_ORIGINAL_TEXT} css={styles.tab}>
            Source
          </Tabs.Tab>
          <Tabs.Tab
            panelId={OutputTab.GENERATED_TEXT}
            isDisabled={(ai.isGenerating && !ai.output.length) || !ai.output.length}
            css={styles.tab}>
            Result
          </Tabs.Tab>
        </Tabs.List>

        <OutputTextPanels
          onGenerate={onGenerate}
          outputFieldId={outputFieldId}
          outputFieldLocale={outputFieldLocale}
          outputFieldValidation={outputFieldValidation}
          inputText={inputText}
          ai={ai}
          isNewText={isNewText}
        />
      </Tabs>
    </Flex>
  );
};

export default Output;
export { OutputTab };
