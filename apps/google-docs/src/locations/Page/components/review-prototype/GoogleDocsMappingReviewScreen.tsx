import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  Flex,
  Heading,
  Paragraph,
  Text,
  Button,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import {
  GoogleDocsReviewFixture,
  FixtureContentBlock,
  FixtureTable,
  FixtureUsageItem,
} from '../../../../fixtures/googleDocsReview';

interface GoogleDocsMappingReviewScreenProps {
  fixture: GoogleDocsReviewFixture;
  onBack: () => void;
}

type DocSegment =
  | { kind: 'block'; id: string; position: number; block: FixtureContentBlock }
  | { kind: 'table'; id: string; position: number; table: FixtureTable };

const getBlockText = (block: FixtureContentBlock): string => {
  return block.textRuns
    .map((run) => run.text)
    .join('')
    .trim();
};

const getSegmentLabel = (segment: DocSegment): string => {
  if (segment.kind === 'table') {
    return `Table (${segment.id})`;
  }

  if (segment.block.type === 'heading') {
    return `Heading H${segment.block.headingLevel ?? 2} (${segment.id})`;
  }

  if (segment.block.type === 'listItem') {
    return `List item (${segment.id})`;
  }

  return `Paragraph (${segment.id})`;
};

const formatUsage = (usage: FixtureUsageItem): string => {
  return `${usage.contentTypeId}.${usage.fieldId}`;
};

const buildUsageFromMappingPlan = (fixture: GoogleDocsReviewFixture) => {
  const blockUsage: Record<string, FixtureUsageItem[]> = {};
  const tableUsage: Record<string, FixtureUsageItem[]> = {};

  fixture.mappingPlan.entries.forEach((mappingEntry, entryIndex) => {
    mappingEntry.fieldMappings.forEach((fieldMapping) => {
      fieldMapping.sourceBlockIds.forEach((blockId) => {
        if (!blockUsage[blockId]) {
          blockUsage[blockId] = [];
        }
        blockUsage[blockId].push({
          entryIndex,
          contentTypeId: mappingEntry.contentTypeId,
          fieldId: fieldMapping.fieldId,
        });
      });

      fieldMapping.sourceTableIds.forEach((tableId) => {
        if (!tableUsage[tableId]) {
          tableUsage[tableId] = [];
        }
        tableUsage[tableId].push({
          entryIndex,
          contentTypeId: mappingEntry.contentTypeId,
          fieldId: fieldMapping.fieldId,
        });
      });
    });
  });

  return { blockUsage, tableUsage };
};

const getEntryDisplayTitle = (entry: GoogleDocsReviewFixture['entries'][number]): string => {
  const titleField = entry.fields?.title;
  if (typeof titleField !== 'object' || titleField === null) {
    return entry.contentTypeId;
  }

  const localeValue = Object.values(titleField as Record<string, unknown>).find(
    (value) => typeof value === 'string'
  );

  return typeof localeValue === 'string' && localeValue.trim().length > 0
    ? localeValue
    : entry.contentTypeId;
};

export const GoogleDocsMappingReviewScreen = ({
  fixture,
  onBack,
}: GoogleDocsMappingReviewScreenProps) => {
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const sourceUsage = useMemo(() => buildUsageFromMappingPlan(fixture), [fixture]);

  const segments = useMemo<DocSegment[]>(() => {
    const blockSegments: DocSegment[] = fixture.normalizedDocument.contentBlocks.map((block) => ({
      kind: 'block',
      id: block.id,
      position: block.position,
      block,
    }));
    const tableSegments: DocSegment[] = fixture.normalizedDocument.tables.map((table) => ({
      kind: 'table',
      id: table.id,
      position: table.position,
      table,
    }));

    return [...blockSegments, ...tableSegments].sort((a, b) => a.position - b.position);
  }, [fixture.normalizedDocument.contentBlocks, fixture.normalizedDocument.tables]);

  const getUsageForSegment = (segment: DocSegment): FixtureUsageItem[] => {
    if (segment.kind === 'table') {
      return sourceUsage.tableUsage[segment.id] ?? [];
    }
    return sourceUsage.blockUsage[segment.id] ?? [];
  };

  const getVisibleUsage = (usage: FixtureUsageItem[]): FixtureUsageItem[] => {
    if (selectedEntryIndex === null) {
      return usage;
    }
    return usage.filter((item) => item.entryIndex === selectedEntryIndex);
  };

  const highlightedSegmentCount = segments.filter((segment) => {
    const usage = getVisibleUsage(getUsageForSegment(segment));
    return usage.length > 0;
  }).length;

  return (
    <Flex flexDirection="column" gap="spacingM" style={{ padding: tokens.spacingL }}>
      <Flex alignItems="center" justifyContent="space-between">
        <Box>
          <Heading marginBottom="spacing2Xs">Google Doc mapping review (prototype)</Heading>
          <Paragraph marginBottom="none" color="gray700">
            Left panel shows normalized segments. Green blocks are mapped into entry fields.
          </Paragraph>
        </Box>
        <Flex alignItems="center" gap="spacingS">
          <Badge>
            {highlightedSegmentCount}/{segments.length} mapped segments visible
          </Badge>
          <Button variant="secondary" onClick={onBack}>
            Back to current page
          </Button>
        </Flex>
      </Flex>

      <Flex gap="spacingM" alignItems="stretch" style={{ minHeight: '70vh' }}>
        <Card
          padding="none"
          style={{
            flex: 2,
            overflow: 'auto',
            border: `1px solid ${tokens.gray300}`,
          }}>
          <Box padding="spacingM" style={{ borderBottom: `1px solid ${tokens.gray300}` }}>
            <Text fontWeight="fontWeightDemiBold">Document outline</Text>
            <Text as="p" fontColor="gray600" marginBottom="none">
              {fixture.normalizedDocument.title ?? fixture.normalizedDocument.documentId}
            </Text>
          </Box>
          <Flex flexDirection="column" gap="spacingS" style={{ padding: tokens.spacingM }}>
            {segments.map((segment) => {
              const allUsage = getUsageForSegment(segment);
              const visibleUsage = getVisibleUsage(allUsage);
              const isMapped = visibleUsage.length > 0;

              return (
                <Box
                  key={`${segment.kind}-${segment.id}`}
                  style={{
                    border: `1px solid ${isMapped ? tokens.green500 : tokens.gray300}`,
                    borderRadius: tokens.borderRadiusMedium,
                    padding: tokens.spacingS,
                    backgroundColor: isMapped ? tokens.green100 : tokens.gray100,
                  }}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text fontWeight="fontWeightDemiBold">{getSegmentLabel(segment)}</Text>
                    <Text fontColor={isMapped ? 'green700' : 'gray600'} fontSize="fontSizeS">
                      {isMapped ? 'Mapped' : 'Unmapped'}
                    </Text>
                  </Flex>

                  {segment.kind === 'table' ? (
                    <Box marginTop="spacingXs">
                      <Table>
                        <TableHead>
                          <TableRow>
                            {segment.table.headers.map((header) => (
                              <TableCell key={header}>{header}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {segment.table.rows.map((row, rowIndex) => (
                            <TableRow key={`${segment.table.id}-row-${rowIndex}`}>
                              {row.cells.map((cell, cellIndex) => (
                                <TableCell
                                  key={`${segment.table.id}-cell-${rowIndex}-${cellIndex}`}>
                                  {cell}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  ) : (
                    <Text as="p" marginTop="spacingXs" marginBottom="none">
                      {getBlockText(segment.block)}
                    </Text>
                  )}

                  {visibleUsage.length > 0 && (
                    <Flex marginTop="spacingXs" gap="spacing2Xs" flexWrap="wrap">
                      {visibleUsage.map((usage, index) => (
                        <Badge
                          key={`${segment.id}-${usage.entryIndex}-${usage.fieldId}-${index}`}
                          variant="primary">
                          {formatUsage(usage)}
                        </Badge>
                      ))}
                    </Flex>
                  )}
                </Box>
              );
            })}
          </Flex>
        </Card>

        <Card
          padding="none"
          style={{
            flex: 1,
            overflow: 'auto',
            border: `1px solid ${tokens.gray300}`,
          }}>
          <Box padding="spacingM" style={{ borderBottom: `1px solid ${tokens.gray300}` }}>
            <Text fontWeight="fontWeightDemiBold">Entries to create</Text>
            <Text as="p" fontColor="gray600" marginBottom="none">
              Select an entry to filter highlighted source segments.
            </Text>
          </Box>

          <Flex flexDirection="column" gap="spacingS" style={{ padding: tokens.spacingM }}>
            <Card
              onClick={() => setSelectedEntryIndex(null)}
              style={{
                cursor: 'pointer',
                border:
                  selectedEntryIndex === null
                    ? `2px solid ${tokens.blue600}`
                    : `1px solid ${tokens.gray300}`,
              }}>
              <Text fontWeight="fontWeightDemiBold">Show all mappings</Text>
            </Card>

            {fixture.entries.map((entry, entryIndex) => {
              const isSelected = selectedEntryIndex === entryIndex;
              const fieldMappings = fixture.mappingPlan.entries[entryIndex]?.fieldMappings ?? [];

              return (
                <Card
                  key={entry.tempId ?? `${entry.contentTypeId}-${entryIndex}`}
                  onClick={() => setSelectedEntryIndex(entryIndex)}
                  style={{
                    cursor: 'pointer',
                    border: isSelected
                      ? `2px solid ${tokens.blue600}`
                      : `1px solid ${tokens.gray300}`,
                    backgroundColor: isSelected ? tokens.blue100 : 'transparent',
                  }}>
                  <Text fontWeight="fontWeightDemiBold">{getEntryDisplayTitle(entry)}</Text>
                  <Text as="p" fontColor="gray700" marginBottom="spacing2Xs">
                    {entry.contentTypeId}
                  </Text>
                  <Flex gap="spacing2Xs" flexWrap="wrap">
                    {fieldMappings.map((field) => (
                      <Badge key={`${entryIndex}-${field.fieldId}`} variant="secondary">
                        {field.fieldId}
                      </Badge>
                    ))}
                  </Flex>
                </Card>
              );
            })}
          </Flex>
        </Card>
      </Flex>
    </Flex>
  );
};
