import { Box, Card, Flex, Paragraph, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { cx } from '@emotion/css';
import type { EntryListRow } from '../../../../utils/entryList';
import {
  treeChildRowBase,
  treeChildRowLast,
  treeChildRowNotLast,
  treeChildrenList,
} from './EntryList.styles';
import { truncateLabel } from '../../../../utils/utils';

export interface EntryListProps {
  rows: EntryListRow[];
  selectedEntryIndex: number;
  onSelect: (entryIndex: number) => void;
}

interface EntryRowCardProps {
  row: EntryListRow;
  selectedEntryIndex: number;
  onSelect: (entryIndex: number) => void;
  showTreeLines: boolean;
  isLastRow?: boolean;
}

function EntryRowCard({
  row,
  selectedEntryIndex,
  onSelect,
  showTreeLines,
  isLastRow = true,
}: EntryRowCardProps) {
  const isSelected = row.entryIndex === selectedEntryIndex;

  const treeLineClass =
    showTreeLines && cx(treeChildRowBase, isLastRow ? treeChildRowLast : treeChildRowNotLast);

  const rowContent = (
    <>
      <Card
        padding="default"
        as="button"
        type="button"
        onClick={() => {
          if (!isSelected) onSelect(row.entryIndex);
        }}
        style={{
          border: `2px solid ${isSelected ? tokens.blue500 : tokens.gray300}`,
          backgroundColor: tokens.colorWhite,
          cursor: isSelected ? 'default' : 'pointer',
          textAlign: 'left',
          width: '100%',
        }}>
        <Paragraph marginBottom="none">
          <Text as="span" fontWeight="fontWeightDemiBold">
            {row.contentTypeName || 'Untitled'}
          </Text>
          {row.contentTypeName && row.entryTitle ? (
            <Text as="span" fontColor="gray600">
              {' '}
              ({truncateLabel(row.entryTitle, 150)})
            </Text>
          ) : null}
        </Paragraph>
      </Card>
      {row.children.length > 0 ? (
        <Box className={treeChildrenList}>
          {row.children.map((child, index) => (
            <EntryRowCard
              key={child.id}
              row={child}
              selectedEntryIndex={selectedEntryIndex}
              onSelect={onSelect}
              showTreeLines
              isLastRow={index === row.children.length - 1}
            />
          ))}
        </Box>
      ) : null}
    </>
  );

  if (treeLineClass) {
    return <Box className={treeLineClass}>{rowContent}</Box>;
  }

  return (
    <Flex flexDirection="column" gap="spacingS">
      {rowContent}
    </Flex>
  );
}

export function EntryList({ rows, selectedEntryIndex, onSelect }: EntryListProps) {
  return (
    <Flex flexDirection="column" gap="spacingS">
      {rows.map((row) => (
        <EntryRowCard
          key={row.id}
          row={row}
          selectedEntryIndex={selectedEntryIndex}
          onSelect={onSelect}
          showTreeLines={false}
        />
      ))}
    </Flex>
  );
}
