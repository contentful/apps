import { Button, Tabs } from '@contentful/f36-components';
import TextFieldWithButtons from '@components/common/text-field-with-buttons/TextFieldWIthButtons';
import { OutputTab } from '../Output';

interface Props {
  inputText: string;
  onFieldChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  generate: () => void;
}

const OriginalTextPanel = (props: Props) => {
  const { inputText, onFieldChange, generate } = props;
  return (
    <Tabs.Panel id={OutputTab.ORIGINAL_TEXT}>
      <TextFieldWithButtons inputText={inputText} onFieldChange={onFieldChange}>
        <Button onClick={generate} isDisabled={!inputText}>
          Generate
        </Button>
      </TextFieldWithButtons>
    </Tabs.Panel>
  );
};

export default OriginalTextPanel;
