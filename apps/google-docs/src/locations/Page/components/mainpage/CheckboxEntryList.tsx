import { Box, Card, Checkbox, Flex, Paragraph, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { cx } from '@emotion/css';
import type { CheckboxEntryListRow } from '../../../../utils/checkboxEntryList';
import {
  treeChildRowBase,
  treeChildRowLast,
  treeChildRowNotLast,
  treeChildrenList,
} from './CheckboxEntryList.styles';
import { truncateLabel } from '../../../../utils/utils';

export interface CheckboxEntryListProps {
  rows: CheckboxEntryListRow[];
  selectedIds: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
}

interface CheckboxEntryRowCardProps {
  row: CheckboxEntryListRow;
  selectedIds: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  showTreeLines: boolean;
  isLastRow?: boolean;
}

function CheckboxEntryRowCard({
  row,
  selectedIds,
  onToggle,
  showTreeLines,
  isLastRow = true,
}: CheckboxEntryRowCardProps) {
  const checked = selectedIds.has(row.id);
  const checkboxId = `checkbox-entry-list-${row.id}`;

  const treeLineClass =
    showTreeLines && cx(treeChildRowBase, isLastRow ? treeChildRowLast : treeChildRowNotLast);

  const rowContent = (
    <>
      <Card
        padding="default"
        style={{
          border: `1px solid ${tokens.gray300}`,
          backgroundColor: tokens.colorWhite,
        }}>
        <Checkbox
          id={checkboxId}
          name={checkboxId}
          isChecked={checked}
          onChange={(e) => onToggle(row.id, (e.target as HTMLInputElement).checked)}
          aria-label={
            row.contentTypeName ? `${row.contentTypeName}: ${row.entryTitle}` : row.entryTitle
          }>
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
        </Checkbox>
      </Card>
      {row.children.length > 0 ? (
        <Box className={treeChildrenList}>
          {row.children.map((child, index) => (
            <CheckboxEntryRowCard
              key={child.id}
              row={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
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

export function CheckboxEntryList({ rows, selectedIds, onToggle }: CheckboxEntryListProps) {
  return (
    <Flex flexDirection="column" gap="spacingS">
      {rows.map((row) => (
        <CheckboxEntryRowCard
          key={row.id}
          row={row}
          selectedIds={selectedIds}
          onToggle={onToggle}
          showTreeLines={false}
        />
      ))}
    </Flex>
  );
}
