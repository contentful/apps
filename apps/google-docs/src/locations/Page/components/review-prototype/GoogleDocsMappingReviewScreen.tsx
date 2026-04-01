import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  Flex,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Text,
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

interface BaseOutlineSection {
  id: string;
  title: string;
  segments: DocSegment[];
}

type OutlineSection = BaseOutlineSection;

const getBlockText = (block: FixtureContentBlock): string => {
  return block.textRuns
    .map((run) => run.text)
    .join('')
    .trim();
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

  const sections = useMemo<OutlineSection[]>(() => {
    const result: BaseOutlineSection[] = [];
    let currentSection: BaseOutlineSection | null = null;

    segments.forEach((segment) => {
      if (segment.kind === 'table') {
        result.push({
          id: `section-${segment.id}`,
          title: 'Table',
          segments: [segment],
        });
        currentSection = null;
        return;
      }

      const isHeading = segment.block.type === 'heading' && getBlockText(segment.block).length > 0;

      if (isHeading) {
        const headingText = getBlockText(segment.block);
        const section: BaseOutlineSection = {
          id: `section-${segment.id}`,
          title: headingText,
          segments: [segment],
        };
        result.push(section);
        currentSection = section;
        return;
      }

      if (!currentSection) {
        currentSection = {
          id: `section-${segment.id}`,
          title: getBlockText(segment.block) || 'Section',
          segments: [],
        };
        result.push(currentSection);
      }
      currentSection.segments.push(segment);
    });
    return result;
  }, [segments]);

  const imageById = useMemo(() => {
    const images = fixture.normalizedDocument.images ?? [];
    return images.reduce<Record<string, (typeof images)[number]>>((acc, image) => {
      acc[image.id] = image;
      return acc;
    }, {});
  }, [fixture.normalizedDocument.images]);

  const getUsageForSegment = (segment: DocSegment): FixtureUsageItem[] => {
    if (segment.kind === 'table') {
      return sourceUsage.tableUsage[segment.id] ?? [];
    }
    return sourceUsage.blockUsage[segment.id] ?? [];
  };

  const getUsageForSection = (section: OutlineSection): FixtureUsageItem[] => {
    const aggregated = section.segments.flatMap(getUsageForSegment);
    const seen = new Set<string>();
    return aggregated.filter((usage) => {
      const key = `${usage.entryIndex}-${usage.contentTypeId}-${usage.fieldId}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const getImagesForSegment = (
    segment: DocSegment
  ): Array<NonNullable<GoogleDocsReviewFixture['normalizedDocument']['images']>[number]> => {
    const imageIds = segment.kind === 'table' ? segment.table.imageIds : segment.block.imageIds;
    return imageIds.map((id) => imageById[id]).filter(Boolean);
  };

  const getVisibleUsage = (usage: FixtureUsageItem[]): FixtureUsageItem[] => {
    if (selectedEntryIndex === null) {
      return usage;
    }
    return usage.filter((item) => item.entryIndex === selectedEntryIndex);
  };

  const getMappingCardsForSection = (section: OutlineSection) => {
    const visibleUsage = getVisibleUsage(getUsageForSection(section));
    return visibleUsage.map((usage) => {
      const fieldMappings = fixture.mappingPlan.entries[usage.entryIndex]?.fieldMappings ?? [];
      const fieldMapping = fieldMappings.find((mapping) => mapping.fieldId === usage.fieldId);
      return {
        key: `${section.id}-${usage.entryIndex}-${usage.fieldId}`,
        fieldId: usage.fieldId,
        fieldType: fieldMapping?.fieldType,
      };
    });
  };

  return (
    <Flex flexDirection="column" gap="spacingM" style={{ padding: tokens.spacingL }}>
      <Flex justifyContent="space-between" alignItems="center">
        <Text fontWeight="fontWeightDemiBold">Google Docs Mapping Review</Text>
        <Button variant="secondary" size="small" onClick={onBack}>
          Back
        </Button>
      </Flex>
      <Card
        padding="none"
        style={{
          minHeight: '70vh',
          overflow: 'auto',
          border: `1px solid ${tokens.gray300}`,
        }}>
        <Box padding="spacingM" style={{ borderBottom: `1px solid ${tokens.gray300}` }}>
          <Text fontWeight="fontWeightDemiBold">Document outline</Text>
          <Text as="p" fontColor="gray600" marginBottom="none">
            {fixture.normalizedDocument.title ?? fixture.normalizedDocument.documentId}
          </Text>
          <Flex marginTop="spacingS" gap="spacing2Xs" flexWrap="wrap">
            <Button
              size="small"
              variant={selectedEntryIndex === null ? 'primary' : 'secondary'}
              onClick={() => setSelectedEntryIndex(null)}>
              All mappings
            </Button>
            {fixture.entries.map((entry, entryIndex) => (
              <Button
                key={entry.tempId ?? `${entry.contentTypeId}-${entryIndex}`}
                size="small"
                variant={selectedEntryIndex === entryIndex ? 'primary' : 'secondary'}
                onClick={() => setSelectedEntryIndex(entryIndex)}>
                {getEntryDisplayTitle(entry)}
              </Button>
            ))}
          </Flex>
        </Box>
        <Flex flexDirection="column" gap="spacingS" style={{ padding: tokens.spacingM }}>
          {sections.map((section) => {
            const allUsage = getUsageForSection(section);
            const visibleUsage = getVisibleUsage(allUsage);
            const mappingCards = getMappingCardsForSection(section);
            const isMapped = visibleUsage.length > 0;

            return (
              <Box key={section.id}>
                <Flex gap="spacingM" alignItems="stretch">
                  <Box style={{ flex: 2 }}>
                    <Box
                      style={{
                        border: `1px solid ${isMapped ? tokens.green500 : tokens.gray300}`,
                        borderRadius: tokens.borderRadiusMedium,
                        padding: tokens.spacingS,
                        backgroundColor: isMapped ? tokens.green100 : tokens.gray100,
                      }}>
                      <Text fontWeight="fontWeightDemiBold">{section.title}</Text>

                      <Flex flexDirection="column" gap="spacingXs" marginTop="spacingXs">
                        {section.segments.map((segment) => (
                          <Box
                            key={`${segment.kind}-${segment.id}`}
                            style={{
                              borderRadius: tokens.borderRadiusMedium,
                              padding: tokens.spacingS,
                              backgroundColor: 'transparent',
                            }}>
                            {segment.kind === 'table' ? (
                              <Box>
                                <Text fontWeight="fontWeightDemiBold">Table</Text>
                                <Box marginTop="spacingXs">
                                  <Table>
                                    <TableHead>
                                      <TableRow>
                                        {segment.table.headers.map((header, headerIndex) => (
                                          <TableCell
                                            key={`${segment.table.id}-header-${headerIndex}`}>
                                            {header}
                                          </TableCell>
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
                              </Box>
                            ) : (
                              getBlockText(segment.block) && (
                                <Text as="p" marginBottom="none">
                                  {getBlockText(segment.block)}
                                </Text>
                              )
                            )}

                            {getImagesForSegment(segment).map((image) => (
                              <Box key={image.id} marginTop="spacingS">
                                <Box
                                  as="img"
                                  src={image.url}
                                  alt={image.altText ?? image.title ?? 'Document image'}
                                  style={{
                                    width: '100%',
                                    maxHeight: 280,
                                    objectFit: 'contain',
                                    borderRadius: tokens.borderRadiusMedium,
                                    border: `1px solid ${tokens.gray300}`,
                                    backgroundColor: tokens.gray100,
                                  }}
                                />
                                {(image.title || image.altText) && (
                                  <Text
                                    as="p"
                                    fontColor="gray700"
                                    marginBottom="none"
                                    marginTop="spacing2Xs">
                                    {image.title ?? image.altText}
                                  </Text>
                                )}
                              </Box>
                            ))}
                          </Box>
                        ))}
                      </Flex>
                    </Box>
                  </Box>

                  <Box style={{ flex: 1 }}>
                    <Flex flexDirection="column" gap="spacingS">
                      {mappingCards.length > 0 ? (
                        mappingCards.map((mappingCard) => (
                          <Box
                            key={mappingCard.key}
                            style={{
                              border: `1px solid ${tokens.green500}`,
                              borderRadius: tokens.borderRadiusMedium,
                              padding: tokens.spacingS,
                              backgroundColor: tokens.green100,
                            }}>
                            <Text as="p" marginBottom="spacing2Xs" fontColor="gray700">
                              Field
                            </Text>
                            <Text as="p" marginBottom="none" fontWeight="fontWeightDemiBold">
                              {mappingCard.fieldId}
                              {mappingCard.fieldType ? ` (${mappingCard.fieldType})` : ''}
                            </Text>
                          </Box>
                        ))
                      ) : (
                        <Box
                          style={{
                            border: `1px solid ${tokens.gray300}`,
                            borderRadius: tokens.borderRadiusMedium,
                            padding: tokens.spacingS,
                            backgroundColor: tokens.gray100,
                          }}>
                          <Text as="p" marginBottom="none" fontColor="gray700">
                            No mappings for this section
                          </Text>
                        </Box>
                      )}
                    </Flex>
                  </Box>
                </Flex>
              </Box>
            );
          })}
        </Flex>
      </Card>
    </Flex>
  );
};
