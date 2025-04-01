import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  lineNumberStyle,
  copyButtonBar,
  copyButtonStyles,
  codeBlockErrorWithCopyButtonBorder,
  codeBlockErrorWithoutCopyButtonBorder,
  codeBlockWithCopyButtonBorder,
  codeBlockWithoutCopyButtonBorder,
} from './CodeBlock.styles';
import { BorderRadiusTokens } from '@contentful/f36-tokens';
import { CopyButton, Flex } from '@contentful/f36-components';

type Props = {
  code: string;
  language?: string;
  hasError?: boolean;
  border?: BorderRadiusTokens;
  showCopyButton?: boolean;
};
const CodeBlock = ({ code, language, hasError, showCopyButton }: Props) => {
  const languageWithoutColor = 'pureBasic';
  let styles = hasError
    ? showCopyButton
      ? codeBlockErrorWithCopyButtonBorder
      : codeBlockErrorWithoutCopyButtonBorder
    : showCopyButton
    ? codeBlockWithCopyButtonBorder
    : codeBlockWithoutCopyButtonBorder;

  return (
    <>
      {showCopyButton && (
        <Flex style={copyButtonBar} alignItems="center" justifyContent="end">
          <CopyButton data-testid="copy-button" value={code} style={copyButtonStyles} />
        </Flex>
      )}
      <SyntaxHighlighter
        data-testid="code-component"
        language={!hasError ? language : languageWithoutColor}
        style={styles}
        lineNumberStyle={lineNumberStyle}
        showLineNumbers>
        {code}
      </SyntaxHighlighter>
    </>
  );
};

export default CodeBlock;
