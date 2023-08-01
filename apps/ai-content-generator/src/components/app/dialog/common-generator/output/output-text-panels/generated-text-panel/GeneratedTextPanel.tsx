import { Button, CopyButton, Tabs } from '@contentful/f36-components';
import useAI from '@hooks/dialog/useAI';
import TextFieldWithButtons from '@components/common/text-field-with-buttons/TextFieldWIthButtons';
import { OutputTab } from '../../Output';
import { ContentTypeFieldValidation } from 'contentful-management';
import { useEffect, useState } from 'react';
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
  outputFieldValidation: ContentTypeFieldValidation | null;
  apply: () => void;
}

const GeneratedTextPanel = (props: Props) => {
  const { generate, ai, outputFieldValidation, apply } = props;
  const { sendStopSignal, output, setOutput, isGenerating } = ai;

  const [canApply, setCanApply] = useState(false);

  const handleGeneratedTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOutput(event.target.value);
  };

  const checkIfCanApply = () => {
    if (isGenerating) {
      return;
    }

    const min = outputFieldValidation?.size?.min || 0;
    const max = outputFieldValidation?.size?.max || Infinity;

    const length = output.length;
    const isLengthValid = length >= min && length <= max;

    setCanApply(isLengthValid);
  };

  useEffect(checkIfCanApply, [output]);

  return (
    <Tabs.Panel id={OutputTab.GENERATED_TEXT}>
      {isGenerating ? (
        <TextFieldWithButtons
          inputText={output}
          sizeValidation={{ max: outputFieldValidation?.size?.max }}>
          <Button onClick={sendStopSignal}>Stop Generating</Button>
        </TextFieldWithButtons>
      ) : (
        <TextFieldWithButtons
          inputText={output}
          sizeValidation={outputFieldValidation?.size}
          onFieldChange={handleGeneratedTextChange}>
          <>
            <CopyButton value={output} />
            <Button onClick={generate} css={styles.button}>
              Regenerate
            </Button>
            <Button isDisabled={!canApply} onClick={apply} css={styles.button} variant="primary">
              Apply
            </Button>
          </>
        </TextFieldWithButtons>
      )}
    </Tabs.Panel>
  );
};

export default GeneratedTextPanel;
