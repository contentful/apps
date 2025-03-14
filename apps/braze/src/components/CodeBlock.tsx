import { Flex, CopyButton } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { codeBlockStyles, lineNumberStyle } from './codeblock.style';

type Props = {
  code: string;
};
const CodeBlock = ({ code }: Props) => {
  return (
    <>
      <Flex
        style={{
          backgroundColor: tokens.gray400,
          height: tokens.spacing2Xl,
          borderTopLeftRadius: tokens.borderRadiusSmall,
          borderTopRightRadius: tokens.borderRadiusSmall,
        }}
        alignItems="center"
        justifyContent="end">
        <CopyButton
          value={code}
          style={{
            height: tokens.spacingXl,
            width: tokens.spacingXl,
            minHeight: tokens.spacingXl,
            marginRight: tokens.spacingXs,
          }}
        />
      </Flex>
      <SyntaxHighlighter
        language="liquid"
        style={codeBlockStyles}
        lineNumberStyle={lineNumberStyle}
        showLineNumbers={true}>
        {code}
      </SyntaxHighlighter>
    </>
  );
};

export default CodeBlock;
