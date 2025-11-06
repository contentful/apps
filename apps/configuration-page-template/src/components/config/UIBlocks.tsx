import { FC, useState } from 'react';
import { Box, Card, Text, Stack, Badge } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

interface BlockCard {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

const blocks: BlockCard[] = [
  {
    id: 'setup-app',
    title: 'Set up this app',
    description: 'Lorem ipsum dolor sit amet, consectetur...',
    tags: ['Set up instructions', 'Content section'],
  },
  {
    id: 'configure-via-key',
    title: 'Your key (required)',
    description: 'sk-...4svb',
    tags: ['Configure via key', 'Form field'],
  },
  {
    id: 'assign-content-types',
    title: 'Assign content types',
    description: 'Select one or more',
    tags: ['Assign content types'],
  },
  {
    id: 'set-up-rules',
    title: 'Set up rules',
    description: 'Add rows to configure rules',
    tags: ['Add rules'],
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    description: 'Lorem ipsum dolor sit amet, consectetur...',
    tags: ['Content section'],
  },
];

interface UIBlocksProps {
  selectedBlocks: string[];
  onSelectionChange: (selectedBlocks: string[]) => void;
}

export const UIBlocks: FC<UIBlocksProps> = ({ selectedBlocks, onSelectionChange }) => {
  const handleBlockClick = (blockId: string) => {
    if (selectedBlocks.includes(blockId)) {
      // Remove from selection
      onSelectionChange(selectedBlocks.filter((id) => id !== blockId));
    } else {
      // Add to selection
      onSelectionChange([...selectedBlocks, blockId]);
    }
  };

  return (
    <Box style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <Text
        fontSize="fontSizeM"
        fontWeight="fontWeightMedium"
        style={{ marginBottom: '12px', display: 'block' }}>
        Select building blocks
      </Text>
      <Text
        fontSize="fontSizeS"
        fontColor="gray600"
        style={{ marginBottom: '16px', display: 'block' }}>
        Start with a template, or select a blank
      </Text>

      <Stack flexDirection="column" spacing="spacingS">
        {blocks.map((block) => {
          const isSelected = selectedBlocks.includes(block.id);
          return (
            <Card
              key={block.id}
              onClick={() => handleBlockClick(block.id)}
              style={{
                cursor: 'pointer',
                border: isSelected ? `2px solid ${tokens.blue500}` : `1px solid ${tokens.gray300}`,
                backgroundColor: isSelected ? tokens.blue100 : 'white',
                transition: 'all 0.2s ease',
              }}>
              <Box style={{ marginBottom: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {block.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" size="small">
                    {tag}
                  </Badge>
                ))}
              </Box>
              <Text
                fontSize="fontSizeM"
                fontWeight="fontWeightMedium"
                style={{ marginBottom: '4px', display: 'block' }}>
                {block.title}
              </Text>
              <Text fontSize="fontSizeS" fontColor="gray600">
                {block.description}
              </Text>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};
