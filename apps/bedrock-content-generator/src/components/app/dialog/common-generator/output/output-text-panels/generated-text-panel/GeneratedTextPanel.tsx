import { errorMessages } from "@components/app/dialog/common-generator/errorMessages";
import Hyperlink from "@components/common/HyperLink/HyperLink";
import TextFieldWithButtons from "@components/common/text-field-with-buttons/TextFieldWIthButtons";
import {
  Button,
  CopyButton,
  Paragraph,
  Tabs,
} from "@contentful/f36-components";
import { ExternalLinkIcon } from "@contentful/f36-icons";
import useAI from "@hooks/dialog/useAI";
import { ContentTypeFieldValidation } from "contentful-management";
import { useEffect, useState } from "react";
import { OutputTab } from "../../Output";
import { styles } from "./GeneratedTextPanel.styles";

interface Props {
  generate: () => void;
  ai: ReturnType<typeof useAI>;
  outputFieldValidation: ContentTypeFieldValidation | null;
  apply: () => void;
}

const GeneratedTextPanel = (props: Props) => {
  const { generate, ai, outputFieldValidation, apply } = props;
  const { output, setOutput, isGenerating, hasError, error } = ai;

  const [canApply, setCanApply] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleGeneratedTextChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!isDirty) {
      setIsDirty(true);
    }

    setOutput(event.target.value);
  };

  const handleRegenerate = () => {
    generate();
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

  useEffect(checkIfCanApply, [
    isGenerating,
    output,
    outputFieldValidation?.size?.max,
    outputFieldValidation?.size?.min,
  ]);

  const getModalErrorMessage = () => {
    if (error?.status === 429) {
      return (
        <>
          <Paragraph css={styles.errorMessage}>
            <Hyperlink
              body={errorMessages.rateLimitMessage}
              substring={errorMessages.rateLimitSubstring}
              hyperLinkHref={errorMessages.rateLimitLink}
              icon={<ExternalLinkIcon />}
              alignIcon="end"
              textLinkStyle={styles.errorLink}
            />
          </Paragraph>
        </>
      );
    } else {
      return (
        <Paragraph css={styles.errorMessage}>
          {errorMessages.defaultGenerateError}
        </Paragraph>
      );
    }
  };

  return (
    <Tabs.Panel id={OutputTab.GENERATED_TEXT} css={styles.panel}>
      {isGenerating ? (
        <TextFieldWithButtons
          inputText={output}
          sizeValidation={outputFieldValidation?.size}
        >
          <Button onClick={() => alert("todo")}>Stop Generating</Button>
        </TextFieldWithButtons>
      ) : (
        <TextFieldWithButtons
          inputText={output}
          sizeValidation={outputFieldValidation?.size}
          onFieldChange={handleGeneratedTextChange}
          hasError={hasError}
          errorMessage={hasError && getModalErrorMessage()}
        >
          <>
            <CopyButton value={output} />
            <Button onClick={handleRegenerate} css={styles.button}>
              Regenerate
            </Button>
            <Button
              isDisabled={!canApply}
              onClick={apply}
              css={styles.button}
              variant="primary"
            >
              Apply
            </Button>
          </>
        </TextFieldWithButtons>
      )}
    </Tabs.Panel>
  );
};

export default GeneratedTextPanel;
