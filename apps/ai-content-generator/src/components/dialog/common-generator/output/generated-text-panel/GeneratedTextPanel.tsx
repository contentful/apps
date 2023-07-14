import { Button, CopyButton, Tabs } from '@contentful/f36-components';
import TextFieldWithButtons from '@components/common/text-field-with-buttons/TextFieldWIthButtons';
import { OutputTab } from '../Output';

interface Props {
  isGenerating: boolean;
  inprogressOutputText: string;
  outputText: string;
  onFieldChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  generate: () => void;
  stopGenerating: () => void;
}

const GeneratedTextPanel = (props: Props) => {
  const {
    isGenerating,
    inprogressOutputText,
    outputText,
    onFieldChange,
    generate,
    stopGenerating,
  } = props;

  return (
    <Tabs.Panel id={OutputTab.GENERATED_TEXT}>
      {isGenerating && (
        <TextFieldWithButtons inputText={inprogressOutputText}>
          <Button onClick={stopGenerating}>Stop Generating</Button>
        </TextFieldWithButtons>
      )}

      {!isGenerating && (
        <TextFieldWithButtons inputText={outputText} onFieldChange={onFieldChange}>
          <>
            <CopyButton value={outputText} />
            <Button onClick={generate}>Regenerate</Button>
            <Button onClick={() => {}}>Apply</Button>
          </>
        </TextFieldWithButtons>
      )}
    </Tabs.Panel>
  );
};

export default GeneratedTextPanel;
