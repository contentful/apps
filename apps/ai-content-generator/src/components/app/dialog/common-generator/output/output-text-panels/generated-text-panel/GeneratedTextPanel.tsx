import { Button, CopyButton, Tabs } from '@contentful/f36-components';
import useAI from '@hooks/dialog/useAI';
import TextFieldWithButtons from '@components/common/text-field-with-buttons/TextFieldWIthButtons';
import { OutputTab } from '../../Output';
import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

export const styles = {
  button: css({
    marginLeft: `${tokens.spacingXs}`,
  }),
};

interface Props {
  generate: () => void;
  ai: ReturnType<typeof useAI>;
  hasOutputField: boolean;
  apply: () => void;
}

const GeneratedTextPanel = (props: Props) => {
  const { generate, ai, hasOutputField, apply } = props;
  const { sendStopSignal, output, setOutput, isGenerating } = ai;

  const handleGeneratedTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOutput(event.target.value);
  };

  return (
    <Tabs.Panel id={OutputTab.GENERATED_TEXT}>
      {isGenerating ? (
        <TextFieldWithButtons inputText={output}>
          <Button onClick={sendStopSignal}>Stop Generating</Button>
        </TextFieldWithButtons>
      ) : (
        <TextFieldWithButtons inputText={output} onFieldChange={handleGeneratedTextChange}>
          <>
            <CopyButton value={output} />
            <Button onClick={generate} css={styles.button}>
              Regenerate
            </Button>
            <Button
              isDisabled={hasOutputField}
              onClick={apply}
              css={styles.button}
              variant="primary">
              Apply
            </Button>
          </>
        </TextFieldWithButtons>
      )}
    </Tabs.Panel>
  );
};

export default GeneratedTextPanel;
