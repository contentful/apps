import { Box, Card, Flex, Paragraph, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { cx } from '@emotion/css';
import type { EntryListRow as OverviewEntryListRow } from '../../../../utils/overviewEntryList';
import {
  treeChildRowBase,
  treeChildRowLast,
  treeChildRowNotLast,
  treeChildrenList,
} from './OverviewEntryList.styles';
import { truncateLabel } from '../../../../utils/utils';

export interface OverviewEntryListProps {
  rows: OverviewEntryListRow[];
  selectedEntryIndex: number | null;
  onSelect: (entryIndex: number) => void;
}

interface OverviewEntryRowCardProps {
  row: OverviewEntryListRow;
  selectedEntryIndex: number | null;
  onSelect: (entryIndex: number) => void;
  showTreeLines: boolean;
  isLastRow?: boolean;
}

function OverviewEntryRowCard({
  row,
  selectedEntryIndex,
  onSelect,
  showTreeLines,
  isLastRow = true,
}: OverviewEntryRowCardProps) {
  const isSelected = row.entryIndex === selectedEntryIndex;

  const treeLineClass =
    showTreeLines && cx(treeChildRowBase, isLastRow ? treeChildRowLast : treeChildRowNotLast);

  const rowContent = (
    <>
      <Card
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
          padding: `${tokens.spacingXs} ${tokens.spacingS}`,
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
            <OverviewEntryRowCard
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

export function OverviewEntryList({ rows, selectedEntryIndex, onSelect }: OverviewEntryListProps) {
  return (
    <Flex flexDirection="column" gap="spacingS">
      {rows.map((row) => (
        <OverviewEntryRowCard
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
