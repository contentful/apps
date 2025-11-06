'use client';

import React, { useEffect } from 'react';
import { makeAssistantToolUI } from '@assistant-ui/react';
import {
  Card,
  Paragraph,
  Heading,
  Stack,
  Badge,
  Text,
  Skeleton,
  Spinner,
} from '@contentful/f36-components';
import { useConfigStore } from '../../store/configStore';
import tokens from '@contentful/f36-tokens';

interface CodeGenerationResult {
  newCode: string;
  newBlocks?: string[];
  messageId: string;
}

interface CodeStats {
  blockCount: number;
  importCount: number;
  stateVariables: number;
  helperFunctions: number;
  linesOfCode: number;
}

// Analyze the generated code to extract statistics
const analyzeCode = (code: string): CodeStats => {
  const lines = code.split('\n');
  const linesOfCode = lines.length;

  // Count imports (lines starting with 'import')
  const importCount = lines.filter((line) => line.trim().startsWith('import')).length;

  // Count state variables (useState declarations)
  const stateVariables = (code.match(/useState</g) || []).length;

  // Count helper functions (function declarations and arrow functions at component level)
  const helperFunctions = (code.match(/const handle\w+\s*=/g) || []).length;

  // Count Card components (each represents a block)
  const blockCount = (code.match(/<Card padding="large">/g) || []).length;

  return {
    blockCount,
    importCount,
    stateVariables,
    helperFunctions,
    linesOfCode,
  };
};

export const CodeGenerationToolUI = makeAssistantToolUI<
  { instruction?: string; modificationType?: string },
  CodeGenerationResult
>({
  toolName: 'generateCode',
  render: function CodeGenerationToolUIRender({ result, status, args }) {
    // No auto-apply - the tool itself updates the store
    console.log('CodeGenerationToolUI result:', result);

    if (!result) {
      return (
        <Card>
          <Stack spacing="spacingM" flexDirection="column">
            <Heading as="h4" marginBottom="spacingS" style={{ fontSize: tokens.fontSizeM }}>
              <Spinner />
              Generating code...
            </Heading>
            <Skeleton.Container>
              <Skeleton.BodyText numberOfLines={3} />
            </Skeleton.Container>
          </Stack>
        </Card>
      );
    }

    const stats = analyzeCode(result.newCode);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
        <Card>
          <Stack spacing="spacingM" flexDirection="column">
            <Heading as="h3" marginBottom="spacingS">
              Code generated successfully
            </Heading>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text fontWeight="fontWeightMedium">Blocks:</Text>
                <Badge variant="primary" size="small">
                  {stats.blockCount}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text fontWeight="fontWeightMedium">Imports:</Text>
                <Badge variant="secondary" size="small">
                  {stats.importCount}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text fontWeight="fontWeightMedium">State Variables:</Text>
                <Badge variant="secondary" size="small">
                  {stats.stateVariables}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text fontWeight="fontWeightMedium">Helper Functions:</Text>
                <Badge variant="secondary" size="small">
                  {stats.helperFunctions}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text fontWeight="fontWeightMedium">Lines of Code:</Text>
                <Badge variant="secondary" size="small">
                  {stats.linesOfCode}
                </Badge>
              </div>
            </div>

            <Paragraph fontColor="gray600">
              The updated code is ready for review. Check the Code tab to see the changes.
            </Paragraph>

            {result.newBlocks && (
              <Paragraph fontSize="fontSizeS" fontColor="gray500">
                Block selection updated: {result.newBlocks.join(', ')}
              </Paragraph>
            )}
          </Stack>
        </Card>
      </div>
    );
  },
});
