import { useMemo, useState } from 'react';
import { Button, Card, Flex, Heading, Layout, Note, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import {
  FieldMapping,
  GoogleDocsContentType,
  GoogleDocsContentTypeField,
  MappingEntry,
  NormalizedContentBlock,
  ReviewPayload,
} from '../../../../utils/types';

interface ReviewPageProps {
  reviewPayload: ReviewPayload;
}

type FilterMode = 'current' | 'all' | 'unassigned';
type AssignmentMode = 'assign' | 'reassign' | null;
type BlockStatus = 'current-entry' | 'other-entry' | 'unassigned' | 'multi-mapped' | 'excluded';

interface BlockDestination {
  key: string;
  entryIndex: number;
  contentTypeId: string;
  entryLabel: string;
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  blockId: string;
}

const FILTER_OPTIONS: Array<{ id: FilterMode; label: string }> = [
  { id: 'current', label: 'Current entry' },
  { id: 'all', label: 'All mappings' },
  { id: 'unassigned', label: 'Unassigned' },
];

const pageStyles = {
  container: {
    maxWidth: '1440px',
    margin: `${tokens.spacingL} auto`,
    padding: tokens.spacingL,
  },
  mutedText: {
    color: tokens.gray700,
    fontSize: tokens.fontSizeM,
    lineHeight: tokens.lineHeightM,
  },
  tabs: {
    display: 'flex',
    gap: tokens.spacing2Xs,
    flexWrap: 'wrap' as const,
  },
  tabButton: {
    borderRadius: tokens.borderRadiusMedium,
  },
  shellGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
    gap: tokens.spacingL,
    alignItems: 'start',
  },
  panelCard: {
    height: '100%',
  },
  blockList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokens.spacingM,
    maxHeight: '70vh',
    overflowY: 'auto' as const,
    paddingRight: tokens.spacingXs,
  },
  blockButton: {
    width: '100%',
    textAlign: 'left' as const,
    borderRadius: tokens.borderRadiusMedium,
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: tokens.spacingM,
    cursor: 'pointer',
    background: tokens.colorWhite,
  },
  blockMetaRow: {
    display: 'flex',
    gap: tokens.spacingXs,
    flexWrap: 'wrap' as const,
    marginBottom: tokens.spacingXs,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightDemiBold,
  },
  destinationCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingS,
    marginTop: tokens.spacingS,
  },
  sectionLabel: {
    margin: 0,
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightDemiBold,
  },
  helperText: {
    margin: 0,
    color: tokens.gray700,
    fontSize: tokens.fontSizeS,
  },
  fieldCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingM,
  },
  selectionCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingM,
    background: tokens.gray100,
  },
};

const blockStatusStyles: Record<
  BlockStatus,
  {
    borderColor: string;
    background: string;
    label: string;
  }
> = {
  'current-entry': {
    borderColor: tokens.green600,
    background: tokens.green100,
    label: 'Mapped to current entry',
  },
  'other-entry': {
    borderColor: tokens.green600,
    background: tokens.colorWhite,
    label: 'Mapped to another entry',
  },
  unassigned: {
    borderColor: tokens.gray400,
    background: tokens.gray100,
    label: 'Unassigned',
  },
  'multi-mapped': {
    borderColor: tokens.green600,
    background: tokens.green100,
    label: 'Mapped to multiple destinations',
  },
  excluded: {
    borderColor: tokens.red500,
    background: tokens.red100,
    label: 'Excluded',
  },
};

const getBlockText = (block: NormalizedContentBlock): string => {
  const text = block.textRuns
    .map((run) => run.text)
    .join('')
    .trim();
  return text.length > 0 ? text : `Untitled ${block.type}`;
};

const getContentTypeLabel = (contentType?: GoogleDocsContentType): string =>
  contentType?.name || contentType?.sys.id || 'Untitled entry';

const cloneMappingEntries = (entries: MappingEntry[]): MappingEntry[] =>
  entries.map((entry) => ({
    ...entry,
    fieldMappings: entry.fieldMappings.map((mapping) => ({
      ...mapping,
      sourceBlockIds: [...mapping.sourceBlockIds],
      sourceTableIds: [...mapping.sourceTableIds],
      sourceAssetIds: [...mapping.sourceAssetIds],
      sourceEntryIds: [...(mapping.sourceEntryIds ?? [])],
    })),
  }));

const getFieldOccupancyLabel = (
  field: GoogleDocsContentTypeField,
  mapping?: FieldMapping
): 'Empty' | 'Filled' | 'Multi-value' => {
  const count = mapping?.sourceBlockIds.length ?? 0;

  if (count === 0) return 'Empty';
  if (field.type === 'Array' || count > 1) return 'Multi-value';
  return 'Filled';
};

const getAssignmentSemantics = (
  field: GoogleDocsContentTypeField,
  occupancy: 'Empty' | 'Filled' | 'Multi-value'
): 'Fill' | 'Append' | 'Coexist' => {
  if (field.type === 'Array') return 'Append';
  if (occupancy === 'Empty') return 'Fill';
  return 'Coexist';
};

export const ReviewPage = ({ reviewPayload }: ReviewPageProps) => {
  const reviewDataReady = Boolean(
    reviewPayload.normalizedDocument &&
      reviewPayload.mappingPlan &&
      reviewPayload.contentTypes &&
      reviewPayload.contentTypes.length > 0
  );

  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [filterMode, setFilterMode] = useState<FilterMode>('current');
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [hoveredDestinationKey, setHoveredDestinationKey] = useState<string | null>(null);
  const [excludedBlockIds, setExcludedBlockIds] = useState<Set<string>>(new Set());
  const [mappingEntries, setMappingEntries] = useState<MappingEntry[]>(
    reviewPayload.mappingPlan ? cloneMappingEntries(reviewPayload.mappingPlan.entries) : []
  );

  const contentTypes = reviewPayload.contentTypes ?? [];
  const normalizedDocument = reviewPayload.normalizedDocument;
  const blocks = normalizedDocument?.contentBlocks ?? [];

  const contentTypeById = useMemo(
    () => new Map(contentTypes.map((contentType) => [contentType.sys.id, contentType] as const)),
    [contentTypes]
  );

  const blockDestinations = useMemo(() => {
    const destinationMap = new Map<string, BlockDestination[]>();

    mappingEntries.forEach((entry, entryIndex) => {
      const contentType = contentTypeById.get(entry.contentTypeId);
      const entryLabel = getContentTypeLabel(contentType);

      entry.fieldMappings.forEach((mapping) => {
        const field = contentType?.fields.find((candidate) => candidate.id === mapping.fieldId);
        const fieldLabel = field?.name || mapping.fieldId;

        mapping.sourceBlockIds.forEach((blockId) => {
          const destination: BlockDestination = {
            key: `${entryIndex}:${mapping.fieldId}:${blockId}`,
            entryIndex,
            contentTypeId: entry.contentTypeId,
            entryLabel,
            fieldId: mapping.fieldId,
            fieldLabel,
            fieldType: mapping.fieldType,
            blockId,
          };

          const existing = destinationMap.get(blockId) ?? [];
          existing.push(destination);
          destinationMap.set(blockId, existing);
        });
      });
    });

    return destinationMap;
  }, [contentTypeById, mappingEntries]);

  const initialSelectedBlockId =
    blocks.find((block) => !excludedBlockIds.has(block.id))?.id ?? null;
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(initialSelectedBlockId);

  if (!reviewDataReady || !normalizedDocument || !reviewPayload.mappingPlan) {
    return (
      <Layout variant="fullscreen" withBoxShadow={true} offsetTop={10}>
        <Layout.Body>
          <Flex flexDirection="column" gap="spacingL" style={pageStyles.container}>
            <Flex flexDirection="column" gap="spacingXs">
              <Heading marginBottom="none">Review your document mappings</Heading>
              <Paragraph marginBottom="none">
                Rich review data is not available yet for this run, so the raw payload is shown
                below.
              </Paragraph>
            </Flex>

            <Card padding="large">
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowX: 'auto',
                  maxHeight: '70vh',
                }}>
                {JSON.stringify(reviewPayload, null, 2)}
              </pre>
            </Card>
          </Flex>
        </Layout.Body>
      </Layout>
    );
  }

  const selectedEntry = mappingEntries[selectedEntryIndex] ?? mappingEntries[0];
  const selectedContentType = contentTypeById.get(selectedEntry.contentTypeId);
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? null;

  const getFieldMapping = (entry: MappingEntry, fieldId: string) =>
    entry.fieldMappings.find((mapping) => mapping.fieldId === fieldId);

  const getDestinationsForBlock = (blockId: string | null) =>
    blockId ? blockDestinations.get(blockId) ?? [] : [];

  const getBlockStatus = (blockId: string): BlockStatus => {
    if (excludedBlockIds.has(blockId)) return 'excluded';

    const destinations = getDestinationsForBlock(blockId);
    if (destinations.length === 0) return 'unassigned';
    if (destinations.length > 1) return 'multi-mapped';
    return destinations[0].entryIndex === selectedEntryIndex ? 'current-entry' : 'other-entry';
  };

  const visibleBlocks = blocks.filter((block) => {
    const destinations = getDestinationsForBlock(block.id);

    if (filterMode === 'unassigned') {
      return destinations.length === 0 && !excludedBlockIds.has(block.id);
    }

    if (filterMode === 'all') {
      return destinations.length > 0 && !excludedBlockIds.has(block.id);
    }

    return true;
  });

  const selectedBlockDestinations = getDestinationsForBlock(selectedBlockId);
  const selectedBlockStatus = selectedBlockId ? getBlockStatus(selectedBlockId) : 'unassigned';
  const selectedBlockStatusLabel = blockStatusStyles[selectedBlockStatus].label;

  const removeBlockFromAllMappings = (entries: MappingEntry[], blockId: string) => {
    entries.forEach((entry) => {
      entry.fieldMappings.forEach((mapping) => {
        mapping.sourceBlockIds = mapping.sourceBlockIds.filter(
          (candidate) => candidate !== blockId
        );
      });
      entry.fieldMappings = entry.fieldMappings.filter(
        (mapping) => mapping.sourceBlockIds.length > 0
      );
    });
  };

  const ensureTargetFieldMapping = (
    entry: MappingEntry,
    field: GoogleDocsContentTypeField
  ): FieldMapping => {
    let mapping = getFieldMapping(entry, field.id);

    if (!mapping) {
      mapping = {
        fieldId: field.id,
        fieldType: field.type,
        sourceBlockIds: [],
        sourceTableIds: [],
        sourceAssetIds: [],
        sourceEntryIds: [],
        confidence: 1,
      };
      entry.fieldMappings = [...entry.fieldMappings, mapping];
    }

    return mapping;
  };

  const handleApplyAssignment = (
    targetEntryIndex: number,
    targetField: GoogleDocsContentTypeField
  ) => {
    if (!selectedBlockId) return;

    setMappingEntries((currentEntries) => {
      const nextEntries = cloneMappingEntries(currentEntries);

      if (assignmentMode === 'reassign') {
        removeBlockFromAllMappings(nextEntries, selectedBlockId);
      }

      const targetEntry = nextEntries[targetEntryIndex];
      const targetMapping = ensureTargetFieldMapping(targetEntry, targetField);

      if (!targetMapping.sourceBlockIds.includes(selectedBlockId)) {
        targetMapping.sourceBlockIds = [...targetMapping.sourceBlockIds, selectedBlockId];
      }

      return nextEntries;
    });

    setExcludedBlockIds((current) => {
      const next = new Set(current);
      next.delete(selectedBlockId);
      return next;
    });
    setSelectedEntryIndex(targetEntryIndex);
    setAssignmentMode(null);
  };

  const handleExclude = () => {
    if (!selectedBlockId) return;

    setMappingEntries((currentEntries) => {
      const nextEntries = cloneMappingEntries(currentEntries);
      removeBlockFromAllMappings(nextEntries, selectedBlockId);
      return nextEntries;
    });
    setExcludedBlockIds((current) => new Set(current).add(selectedBlockId));
    setAssignmentMode(null);
  };

  const handleRestore = () => {
    if (!selectedBlockId) return;

    setExcludedBlockIds((current) => {
      const next = new Set(current);
      next.delete(selectedBlockId);
      return next;
    });
  };

  const renderDestinationCards = (
    block: NormalizedContentBlock,
    destinations: BlockDestination[]
  ) => (
    <div>
      {destinations.map((destination) => {
        const isHovered = hoveredDestinationKey === destination.key || hoveredBlockId === block.id;

        return (
          <div
            key={destination.key}
            style={{
              ...pageStyles.destinationCard,
              borderColor: isHovered ? tokens.blue500 : tokens.gray300,
              background: isHovered ? tokens.blue100 : tokens.gray100,
            }}
            onMouseEnter={() => {
              setHoveredBlockId(block.id);
              setHoveredDestinationKey(destination.key);
            }}
            onMouseLeave={() => {
              setHoveredBlockId(null);
              setHoveredDestinationKey(null);
            }}>
            <div style={{ ...pageStyles.helperText, fontWeight: tokens.fontWeightDemiBold }}>
              {destination.entryLabel}
            </div>
            <div style={pageStyles.helperText}>
              {destination.fieldLabel} ({destination.fieldType})
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderAssignmentChooser = () => {
    if (!selectedBlock || !assignmentMode) return null;

    return (
      <Card padding="default">
        <Flex flexDirection="column" gap="spacingM">
          <div>
            <Heading as="h3" marginBottom="none">
              Choose a destination
            </Heading>
            <Paragraph marginBottom="none">
              {assignmentMode === 'assign'
                ? 'Assign this source block to a field in the current creation flow.'
                : 'Move this source block to a new destination.'}
            </Paragraph>
          </div>

          {mappingEntries.map((entry, entryIndex) => {
            const contentType = contentTypeById.get(entry.contentTypeId);
            const entryLabel = getContentTypeLabel(contentType);

            return (
              <div key={`${entry.contentTypeId}-${entry.tempId ?? entryIndex}`}>
                <p style={pageStyles.sectionLabel}>{entryLabel}</p>
                <Flex flexDirection="column" gap="spacingXs" style={{ marginTop: tokens.spacingS }}>
                  {(contentType?.fields ?? []).map((field) => {
                    const fieldMapping = getFieldMapping(entry, field.id);
                    const occupancy = getFieldOccupancyLabel(field, fieldMapping);
                    const semantics = getAssignmentSemantics(field, occupancy);
                    const actionLabel =
                      assignmentMode === 'assign'
                        ? `Assign to ${entryLabel} ${field.name || field.id}`
                        : `Move to ${entryLabel} ${field.name || field.id}`;

                    return (
                      <Button
                        key={`${entryLabel}-${field.id}`}
                        variant="secondary"
                        onClick={() => handleApplyAssignment(entryIndex, field)}
                        style={{ justifyContent: 'space-between' }}>
                        {actionLabel}
                        <span style={{ marginLeft: tokens.spacingS }}>
                          {occupancy} · {semantics}
                        </span>
                      </Button>
                    );
                  })}
                </Flex>
              </div>
            );
          })}
        </Flex>
      </Card>
    );
  };

  return (
    <Layout variant="fullscreen" withBoxShadow={true} offsetTop={10}>
      <Layout.Body>
        <Flex flexDirection="column" gap="spacingL" style={pageStyles.container}>
          <Flex flexDirection="column" gap="spacingS">
            <Flex justifyContent="space-between" alignItems="flex-start" gap="spacingM">
              <div>
                <Heading marginBottom="none">Review your document mappings</Heading>
                <Paragraph marginBottom="none">
                  Verify how source content maps into each entry, then correct assignments inline.
                </Paragraph>
              </div>
              <Card padding="default">
                <div style={pageStyles.helperText}>Document</div>
                <div style={{ fontWeight: tokens.fontWeightDemiBold }}>
                  {reviewPayload.documentTitle || normalizedDocument.title || 'Untitled document'}
                </div>
                <div style={pageStyles.helperText}>
                  {reviewPayload.reviewSummary || reviewPayload.summary || 'Ready for review'}
                </div>
              </Card>
            </Flex>

            <Note variant="primary">
              Filled green means the content is mapped into the selected entry. Outline-only means
              it maps somewhere else in the same creation flow.
            </Note>
          </Flex>

          <Card padding="default">
            <Flex flexDirection="column" gap="spacingM">
              <div style={pageStyles.tabs} role="tablist" aria-label="Entry tabs">
                {mappingEntries.map((entry, entryIndex) => {
                  const contentType = contentTypeById.get(entry.contentTypeId);
                  const label = getContentTypeLabel(contentType);
                  const isSelected = entryIndex === selectedEntryIndex;

                  return (
                    <Button
                      key={`${entry.contentTypeId}-${entry.tempId ?? entryIndex}`}
                      role="tab"
                      aria-selected={isSelected}
                      variant={isSelected ? 'primary' : 'secondary'}
                      style={pageStyles.tabButton}
                      onClick={() => setSelectedEntryIndex(entryIndex)}>
                      {label}
                    </Button>
                  );
                })}
              </div>

              <Flex gap="spacingXs" flexWrap="wrap">
                {FILTER_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    variant={filterMode === option.id ? 'primary' : 'secondary'}
                    aria-pressed={filterMode === option.id}
                    onClick={() => setFilterMode(option.id)}>
                    {option.label}
                  </Button>
                ))}
              </Flex>
            </Flex>
          </Card>

          <div style={pageStyles.shellGrid}>
            <Card padding="large" style={pageStyles.panelCard}>
              <Flex flexDirection="column" gap="spacingM">
                <div>
                  <Heading as="h2" marginBottom="none">
                    Document provenance
                  </Heading>
                  <Paragraph marginBottom="none">
                    Select a source block to inspect all linked destinations and edit its
                    assignment.
                  </Paragraph>
                </div>

                <div style={pageStyles.blockList}>
                  {visibleBlocks.map((block) => {
                    const status = getBlockStatus(block.id);
                    const destinations = getDestinationsForBlock(block.id);
                    const isSelected = selectedBlockId === block.id;
                    const isHovered = hoveredBlockId === block.id;
                    const statusStyle = blockStatusStyles[status];
                    const blockText = getBlockText(block);

                    return (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => {
                          setSelectedBlockId(block.id);
                          setAssignmentMode(null);
                        }}
                        onMouseEnter={() => setHoveredBlockId(block.id)}
                        onMouseLeave={() => setHoveredBlockId(null)}
                        style={{
                          ...pageStyles.blockButton,
                          borderColor:
                            isSelected || isHovered ? tokens.blue500 : statusStyle.borderColor,
                          background: statusStyle.background,
                          boxShadow: isSelected ? `0 0 0 2px ${tokens.blue200}` : undefined,
                        }}>
                        <div style={pageStyles.blockMetaRow}>
                          <span
                            style={{
                              ...pageStyles.badge,
                              background: tokens.colorWhite,
                              border: `1px solid ${statusStyle.borderColor}`,
                            }}>
                            {statusStyle.label}
                          </span>
                          {destinations.length > 1 && (
                            <span
                              style={{
                                ...pageStyles.badge,
                                background: tokens.yellow100,
                                border: `1px solid ${tokens.yellow500}`,
                              }}>
                              Also used in {destinations.length - 1} other field
                              {destinations.length > 2 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontWeight: tokens.fontWeightDemiBold,
                            marginBottom: tokens.spacingXs,
                          }}>
                          {blockText}
                        </div>
                        <div style={pageStyles.helperText}>
                          {block.type} · block {block.position + 1}
                        </div>

                        {destinations.length > 0 && renderDestinationCards(block, destinations)}
                      </button>
                    );
                  })}
                </div>
              </Flex>
            </Card>

            <Flex flexDirection="column" gap="spacingL">
              <Card padding="large">
                <Flex flexDirection="column" gap="spacingM">
                  <div>
                    <Heading as="h2" marginBottom="none">
                      Selected source
                    </Heading>
                    <Paragraph marginBottom="none">
                      Review the assignment state for the selected content block.
                    </Paragraph>
                  </div>

                  {selectedBlock ? (
                    <div style={pageStyles.selectionCard}>
                      <div
                        style={{
                          fontWeight: tokens.fontWeightDemiBold,
                          marginBottom: tokens.spacingXs,
                        }}>
                        {getBlockText(selectedBlock)}
                      </div>
                      <div style={pageStyles.helperText}>{selectedBlockStatusLabel}</div>

                      <div style={{ marginTop: tokens.spacingM }}>
                        <p style={pageStyles.sectionLabel}>
                          Used in {selectedBlockDestinations.length} destination
                          {selectedBlockDestinations.length === 1 ? '' : 's'}
                        </p>
                        <Flex
                          flexDirection="column"
                          gap="spacingXs"
                          style={{ marginTop: tokens.spacingS }}>
                          {selectedBlockDestinations.length > 0 ? (
                            selectedBlockDestinations.map((destination) => (
                              <Card key={destination.key} padding="default">
                                <div style={{ fontWeight: tokens.fontWeightDemiBold }}>
                                  {destination.fieldLabel}
                                </div>
                                <div style={pageStyles.helperText}>
                                  {destination.entryLabel} · {destination.fieldType}
                                </div>
                              </Card>
                            ))
                          ) : (
                            <div style={pageStyles.helperText}>This block is not assigned yet.</div>
                          )}
                        </Flex>
                      </div>

                      <Flex gap="spacingS" flexWrap="wrap" style={{ marginTop: tokens.spacingM }}>
                        {selectedBlockStatus === 'excluded' ? (
                          <Button variant="secondary" onClick={handleRestore}>
                            Restore
                          </Button>
                        ) : selectedBlockDestinations.length === 0 ? (
                          <>
                            <Button variant="primary" onClick={() => setAssignmentMode('assign')}>
                              Assign
                            </Button>
                            <Button variant="secondary" onClick={handleExclude}>
                              Exclude
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="primary" onClick={() => setAssignmentMode('reassign')}>
                              Reassign
                            </Button>
                            <Button variant="secondary" onClick={handleExclude}>
                              Exclude
                            </Button>
                          </>
                        )}
                      </Flex>
                    </div>
                  ) : (
                    <Paragraph marginBottom="none">
                      Select a source block to begin reviewing.
                    </Paragraph>
                  )}
                </Flex>
              </Card>

              {renderAssignmentChooser()}

              <Card padding="large">
                <Flex flexDirection="column" gap="spacingM">
                  <div>
                    <Heading as="h2" marginBottom="none">
                      Entry mapping panel
                    </Heading>
                    <Paragraph marginBottom="none">
                      Field occupancy for {getContentTypeLabel(selectedContentType)}.
                    </Paragraph>
                  </div>

                  <Flex flexDirection="column" gap="spacingS">
                    {(selectedContentType?.fields ?? []).map((field) => {
                      const mapping = getFieldMapping(selectedEntry, field.id);
                      const occupancy = getFieldOccupancyLabel(field, mapping);
                      const snippets = (mapping?.sourceBlockIds ?? [])
                        .map((blockId) => blocks.find((block) => block.id === blockId))
                        .filter(Boolean)
                        .map((block) => getBlockText(block as NormalizedContentBlock));

                      return (
                        <div
                          key={field.id}
                          style={{
                            ...pageStyles.fieldCard,
                            borderColor: selectedBlockDestinations.some(
                              (destination) =>
                                destination.entryIndex === selectedEntryIndex &&
                                destination.fieldId === field.id
                            )
                              ? tokens.blue500
                              : tokens.gray300,
                          }}>
                          <Flex
                            justifyContent="space-between"
                            alignItems="flex-start"
                            gap="spacingM">
                            <div>
                              <div style={{ fontWeight: tokens.fontWeightDemiBold }}>
                                {field.name || field.id}
                              </div>
                              <div style={pageStyles.helperText}>{field.type}</div>
                            </div>
                            <div style={{ ...pageStyles.badge, background: tokens.gray100 }}>
                              {occupancy}
                            </div>
                          </Flex>

                          <div style={{ marginTop: tokens.spacingS }}>
                            {snippets.length > 0 ? (
                              snippets.map((snippet) => (
                                <Card key={`${field.id}-${snippet}`} padding="default">
                                  <div style={pageStyles.helperText}>{snippet}</div>
                                </Card>
                              ))
                            ) : (
                              <div style={pageStyles.helperText}>No source block assigned.</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </Flex>
                </Flex>
              </Card>
            </Flex>
          </div>
        </Flex>
      </Layout.Body>
    </Layout>
  );
};
