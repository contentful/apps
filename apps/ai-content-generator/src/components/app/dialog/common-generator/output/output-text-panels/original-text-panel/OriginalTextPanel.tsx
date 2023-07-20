import { useContext } from 'react';
import { Button, Tabs } from '@contentful/f36-components';
import { GeneratorContext } from '@providers/generatorProvider';
import TextFieldWithButtons from '@components/common/text-field-with-buttons/TextFieldWIthButtons';
import { GeneratorAction } from '@components/app/dialog/common-generator/generatorReducer';
import { OutputTab } from '../../Output';

interface Props {
  inputText: string;
  generate: () => void;
}

const OriginalTextPanel = (props: Props) => {
  const { inputText, generate } = props;
  const { dispatch } = useContext(GeneratorContext);

  const handleOriginalTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: GeneratorAction.UPDATE_ORIGINAL_TEXT,
      value: event.target.value,
    });
  };

  return (
    <Tabs.Panel id={OutputTab.UPDATE_ORIGINAL_TEXT}>
      <TextFieldWithButtons inputText={inputText} onFieldChange={handleOriginalTextChange}>
        <Button onClick={generate} isDisabled={!inputText}>
          Generate
        </Button>
      </TextFieldWithButtons>
    </Tabs.Panel>
  );
};

export default OriginalTextPanel;
