import { Badge, Box, Card, Checkbox, Flex, Paragraph, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { cx } from '@emotion/css';
import type { EntryListRow as OverviewEntryListRow } from '../../../../utils/overviewEntryList';
import {
  noMappedContentBadge,
  treeChildRowBase,
  treeChildRowLast,
  treeChildRowNotLast,
  treeChildrenList,
} from './OverviewEntryList.styles';
import { truncateLabel } from '../../../../utils/utils';
import { onEnterToggleCheckbox } from '../../../../utils/keyboardUtils';

export interface OverviewEntryListProps {
  rows: OverviewEntryListRow[];
  selectedEntryIndex: number | null;
  selectedEntryKeys: ReadonlySet<string>;
  onSelect: (entryIndex: number) => void;
  onToggleEntrySelection: (entryKey: string, isSelected: boolean) => void;
  areEntrySelectionsDisabled?: boolean;
}

interface OverviewEntryRowCardProps {
  row: OverviewEntryListRow;
  selectedEntryIndex: number | null;
  selectedEntryKeys: ReadonlySet<string>;
  onSelect: (entryIndex: number) => void;
  onToggleEntrySelection: (entryKey: string, isSelected: boolean) => void;
  areEntrySelectionsDisabled: boolean;
  showTreeLines: boolean;
  isLastRow?: boolean;
}

function OverviewEntryRowCard({
  row,
  selectedEntryIndex,
  selectedEntryKeys,
  onSelect,
  onToggleEntrySelection,
  areEntrySelectionsDisabled,
  showTreeLines,
  isLastRow = true,
}: OverviewEntryRowCardProps) {
  const isSelected = row.entryIndex === selectedEntryIndex;
  const isEntrySelectedForCreation = selectedEntryKeys.has(row.id);

  const treeLineClass =
    showTreeLines && cx(treeChildRowBase, isLastRow ? treeChildRowLast : treeChildRowNotLast);

  const rowContent = (
    <>
      <Card
        style={{
          border: `2px solid ${isSelected ? tokens.blue500 : tokens.gray300}`,
          backgroundColor: tokens.colorWhite,
          width: '100%',
          padding: `${tokens.spacingXs} ${tokens.spacingS}`,
        }}>
        <Flex alignItems="center" gap="spacingXs">
          <Checkbox
            aria-label={`Create entry ${row.contentTypeName || 'Untitled'}${
              row.entryTitle ? ` (${truncateLabel(row.entryTitle, 150)})` : ''
            }`}
            isChecked={isEntrySelectedForCreation}
            isDisabled={areEntrySelectionsDisabled}
            onChange={(event) => onToggleEntrySelection(row.id, event.target.checked)}
            onKeyDown={onEnterToggleCheckbox(isEntrySelectedForCreation, (checked) =>
              onToggleEntrySelection(row.id, checked)
            )}
          />
          <button
            type="button"
            onClick={() => {
              if (!isSelected) onSelect(row.entryIndex);
            }}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 0,
              cursor: isSelected ? 'default' : 'pointer',
              flex: 1,
              font: 'inherit',
              padding: 0,
              textAlign: 'left',
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
              {row.hasNoMappedContent && (
                <Badge variant="secondary" size="small" className={noMappedContentBadge}>
                  No mapped content
                </Badge>
              )}
            </Paragraph>
          </button>
        </Flex>
      </Card>
      {row.children.length > 0 ? (
        <Box className={treeChildrenList}>
          {row.children.map((child, index) => (
            <OverviewEntryRowCard
              key={child.id}
              row={child}
              selectedEntryIndex={selectedEntryIndex}
              selectedEntryKeys={selectedEntryKeys}
              onSelect={onSelect}
              onToggleEntrySelection={onToggleEntrySelection}
              areEntrySelectionsDisabled={areEntrySelectionsDisabled}
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

export function OverviewEntryList({
  rows,
  selectedEntryIndex,
  selectedEntryKeys,
  onSelect,
  onToggleEntrySelection,
  areEntrySelectionsDisabled = false,
}: OverviewEntryListProps) {
  return (
    <Flex flexDirection="column" gap="spacingS">
      {rows.map((row) => (
        <OverviewEntryRowCard
          key={row.id}
          row={row}
          selectedEntryIndex={selectedEntryIndex}
          selectedEntryKeys={selectedEntryKeys}
          onSelect={onSelect}
          onToggleEntrySelection={onToggleEntrySelection}
          areEntrySelectionsDisabled={areEntrySelectionsDisabled}
          showTreeLines={false}
        />
      ))}
    </Flex>
  );
}
