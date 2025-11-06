import { FC, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Paragraph,
  Card,
  Text,
  CopyButton,
  Button,
  Badge,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { vscDarkPlus as theme } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DiffViewer } from './DiffViewer';

const codeStyles = {
  root: {
    padding: '32px',
    overflow: 'scroll',
    height: 'calc(100vh - 101px)',
  } as React.CSSProperties,
  blockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
};

interface CodeViewProps {
  currentCode: string;
  suggestedCode: string | null;
  onAcceptChange: () => void;
  onRejectChange: () => void;
}

export const CodeView: FC<CodeViewProps> = ({
  currentCode,
  suggestedCode,
  onAcceptChange,
  onRejectChange,
}) => {
  const [showDiff, setShowDiff] = useState(false);

  // Determine which code to display
  const displayCode = suggestedCode || currentCode;
  const hasSuggestedChanges = suggestedCode !== null;

  return (
    <>
      <Flex flexDirection="column" gap="spacingL" style={codeStyles.root}>
        {!currentCode ? (
          <Card padding="large">
            <Flex
              flexDirection="column"
              gap="spacingM"
              alignItems="center"
              justifyContent="center"
              style={{ minHeight: '400px' }}>
              <Heading as="h3" marginBottom="none">
                Select UI Blocks to View Code
              </Heading>
              <Paragraph fontColor="gray600">
                Choose building blocks from the sidebar to see their code here.
              </Paragraph>
            </Flex>
          </Card>
        ) : (
          <Card padding="none">
            <Box style={{ padding: '16px', borderBottom: `1px solid ${tokens.gray300}` }}>
              <Flex style={codeStyles.blockHeader}>
                <Flex alignItems="center" gap="spacingS">
                  <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
                    ConfigScreen.tsx
                  </Text>
                  {hasSuggestedChanges && (
                    <Badge variant="warning" size="small">
                      Suggested Changes
                    </Badge>
                  )}
                </Flex>
                <Flex gap="spacingS" alignItems="center">
                  {hasSuggestedChanges && (
                    <>
                      <Button size="small" variant="secondary" onClick={() => setShowDiff(true)}>
                        View Diff
                      </Button>
                      <Button size="small" variant="secondary" onClick={onRejectChange}>
                        Reject
                      </Button>
                      <Button size="small" variant="positive" onClick={onAcceptChange}>
                        Accept
                      </Button>
                    </>
                  )}
                  <CopyButton value={displayCode} />
                </Flex>
              </Flex>
            </Box>
            <Box style={{ overflow: 'auto' }}>
              <SyntaxHighlighter
                language="typescript"
                style={theme}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  fontSize: '13px',
                }}
                showLineNumbers>
                {displayCode}
              </SyntaxHighlighter>
            </Box>
          </Card>
        )}
      </Flex>

      {hasSuggestedChanges && suggestedCode && (
        <DiffViewer
          isOpen={showDiff}
          onClose={() => setShowDiff(false)}
          oldCode={currentCode}
          newCode={suggestedCode}
          onAccept={onAcceptChange}
          onReject={onRejectChange}
        />
      )}
    </>
  );
};
