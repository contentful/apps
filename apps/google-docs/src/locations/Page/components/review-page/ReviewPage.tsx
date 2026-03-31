import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Flex,
  FormControl,
  Heading,
  Layout,
  Modal,
  Paragraph,
  Tabs,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import {
  FieldMapping,
  EntryHierarchyItem,
  GoogleDocsRawDocument,
  GoogleDocsRawParagraph,
  GoogleDocsRawParagraphElement,
  GoogleDocsRawStructuralElement,
  GoogleDocsContentType,
  GoogleDocsContentTypeField,
  MappingEntry,
  NormalizedContentBlock,
  ReviewPayload,
} from '../../../../utils/types';

interface ReviewPageProps {
  reviewPayload: ReviewPayload;
}

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

interface RenderableDocElement {
  key: string;
  blockId?: string;
  text: string;
  structuralElement: GoogleDocsRawStructuralElement;
}

interface RangeAnnotation {
  id: string;
  blockId: string;
  text: string;
  destinations: BlockDestination[];
  excluded?: boolean;
}

interface SelectedRange {
  blockId: string;
  text: string;
}

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
  shellGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokens.spacingL,
  },
  docFlow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokens.spacingXs,
  },
  documentSurface: {
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingL} ${tokens.spacingXl}`,
    background: tokens.colorWhite,
  },
  documentRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 180px',
    gap: tokens.spacingS,
    alignItems: 'start',
  },
  blockButton: {
    width: '100%',
    textAlign: 'left' as const,
    borderRadius: tokens.borderRadiusSmall,
    borderWidth: '2px',
    borderStyle: 'solid',
    padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
    cursor: 'pointer',
    background: tokens.colorWhite,
    transition: 'box-shadow 120ms ease, border-color 120ms ease, background 120ms ease',
  },
  blockContent: {
    minWidth: 0,
  },
  destinationCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
    marginTop: tokens.spacing2Xs,
    background: tokens.gray100,
  },
  markerRail: {
    paddingTop: tokens.spacing2Xs,
  },
  docParagraph: {
    margin: 0,
    fontSize: tokens.fontSizeM,
    lineHeight: '1.65',
    color: tokens.gray900,
  },
  docHeading: {
    margin: 0,
    color: tokens.gray900,
    fontWeight: tokens.fontWeightDemiBold,
    lineHeight: '1.3',
  },
  docListItem: {
    display: 'grid',
    gridTemplateColumns: '16px minmax(0, 1fr)',
    gap: tokens.spacingXs,
    alignItems: 'start',
  },
  docBullet: {
    fontSize: tokens.fontSizeM,
    lineHeight: '1.65',
    color: tokens.gray700,
  },
  docTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: tokens.spacingS,
    marginBottom: tokens.spacingS,
  },
  docTableCell: {
    border: `1px solid ${tokens.gray300}`,
    padding: `${tokens.spacingXs} ${tokens.spacingS}`,
    verticalAlign: 'top' as const,
    fontSize: tokens.fontSizeM,
    lineHeight: '1.55',
    color: tokens.gray900,
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
  selectionToolbar: {
    position: 'sticky' as const,
    top: tokens.spacingM,
    zIndex: 2,
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorWhite,
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
    boxShadow: tokens.glowPrimary,
  },
  overviewCard: {
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingM,
    background: tokens.gray100,
  },
  overviewEntryCard: {
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
    background: tokens.colorWhite,
    cursor: 'pointer',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
  },
};

const getBlockText = (block: NormalizedContentBlock): string => {
  const text = block.textRuns
    .map((run) => run.text)
    .join('')
    .trim();
  return text.length > 0 ? text : `Untitled ${block.type}`;
};

const flattenRawDocumentContent = (
  rawDocJson?: GoogleDocsRawDocument
): GoogleDocsRawStructuralElement[] => {
  if (!rawDocJson) return [];

  const rootContent = rawDocJson.body?.content ?? [];
  if (rootContent.length > 0) return rootContent;

  const walkTab = (
    tab: NonNullable<GoogleDocsRawDocument['tabs']>[number]
  ): GoogleDocsRawStructuralElement[] => {
    const tabContent = tab.body?.content ?? [];
    const childContent = (tab.childTabs ?? []).flatMap(walkTab);
    return [...tabContent, ...childContent];
  };

  const flattenedTabs = (rawDocJson.tabs ?? []).flatMap(walkTab);

  return flattenedTabs;
};

const getRawParagraphText = (paragraph?: GoogleDocsRawParagraph): string =>
  (paragraph?.elements ?? [])
    .map((element) => element.textRun?.content ?? '')
    .join('')
    .replace(/\n+$/g, '');

const getRawTableCellText = (cellContent: GoogleDocsRawStructuralElement[] = []): string =>
  cellContent
    .map((element) => {
      if (element.paragraph) return getRawParagraphText(element.paragraph);
      return '';
    })
    .filter(Boolean)
    .join('\n');

const renderRawParagraphRuns = (elements: GoogleDocsRawParagraphElement[] = []) =>
  elements.map((element, index) => {
    const text = (element.textRun?.content ?? '').replace(/\n+$/g, '');
    if (text.length === 0) return null;

    let content: ReactNode = text;
    const textStyle = element.textRun?.textStyle;

    if (textStyle?.bold) content = <strong>{content}</strong>;
    if (textStyle?.italic) content = <em>{content}</em>;
    if (textStyle?.underline) {
      content = <span style={{ textDecoration: 'underline' }}>{content}</span>;
    }

    if (textStyle?.link?.url) {
      content = (
        <a href={textStyle.link.url} target="_blank" rel="noreferrer">
          {content}
        </a>
      );
    }

    return <span key={`raw-run-${index}`}>{content}</span>;
  });

const getInlineObjectImage = (
  rawDocJson: GoogleDocsRawDocument | undefined,
  inlineObjectId?: string
) => {
  if (!rawDocJson || !inlineObjectId) return null;

  const embeddedObject =
    rawDocJson.inlineObjects?.[inlineObjectId]?.inlineObjectProperties?.embeddedObject;
  const src =
    embeddedObject?.imageProperties?.contentUri || embeddedObject?.imageProperties?.sourceUri;

  if (!src) return null;

  return {
    src,
    alt: embeddedObject?.title || embeddedObject?.description || 'Document image',
  };
};

const renderParagraphContent = (
  rawDocJson: GoogleDocsRawDocument | undefined,
  elements: GoogleDocsRawParagraphElement[] = [],
  blockId?: string,
  annotatedText?: string,
  renderAnnotated?: (blockId: string, text: string) => ReactNode
) =>
  elements.map((element, index) => {
    if (element.inlineObjectElement?.inlineObjectId) {
      const image = getInlineObjectImage(rawDocJson, element.inlineObjectElement.inlineObjectId);
      if (!image) return null;

      return (
        <img
          key={`inline-object-${index}`}
          src={image.src}
          alt={image.alt}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: tokens.borderRadiusMedium,
            marginTop: tokens.spacingS,
            marginBottom: tokens.spacingS,
          }}
        />
      );
    }

    if (blockId && annotatedText !== undefined && renderAnnotated) {
      return index === 0 ? (
        <span key={`annotated-text-${index}`}>{renderAnnotated(blockId, annotatedText)}</span>
      ) : null;
    }

    return <span key={`text-run-${index}`}>{renderRawParagraphRuns([element])}</span>;
  });

const getContentTypeLabel = (contentType?: GoogleDocsContentType): string =>
  contentType?.name || contentType?.sys.id || 'Untitled entry';

const getEntryKindLabel = (contentType?: GoogleDocsContentType) => {
  const label = getContentTypeLabel(contentType).toLowerCase();
  return label.includes('page') ? 'Page' : 'Component';
};

const buildOverviewItems = (
  mappingEntries: MappingEntry[],
  entryHierarchy?: EntryHierarchyItem[]
) => {
  if (!entryHierarchy || entryHierarchy.length === 0) {
    return mappingEntries.map((entry, entryIndex) => ({
      key: entry.tempId ?? `entry-${entryIndex}`,
      entry,
      entryIndex,
      depth: 0,
    }));
  }

  return entryHierarchy
    .map((item) => {
      const entry = mappingEntries[item.entryIndex];
      if (!entry) return null;

      return {
        key: entry.tempId ?? `entry-${item.entryIndex}`,
        entry,
        entryIndex: item.entryIndex,
        depth: item.depth,
      };
    })
    .filter(
      (item): item is { key: string; entry: MappingEntry; entryIndex: number; depth: number } =>
        Boolean(item)
    );
};

const getHeadingTag = (headingLevel?: number): 'h2' | 'h3' | 'h4' | 'h5' | 'h6' => {
  switch (headingLevel) {
    case 1:
      return 'h2';
    case 2:
      return 'h3';
    case 3:
      return 'h4';
    case 4:
      return 'h5';
    default:
      return 'h6';
  }
};

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

const getNodeElement = (node: Node | null): Element | null => {
  if (!node) return null;
  if (node instanceof Element) return node;
  return node.parentElement;
};

const getRenderableTextByBlockId = (
  renderableDocElements: RenderableDocElement[],
  fallbackBlocks: NormalizedContentBlock[],
  blockId: string | null
) => {
  if (!blockId) return '';

  const renderableText = renderableDocElements.find((element) => element.blockId === blockId)?.text;
  if (renderableText) return renderableText;

  const block = fallbackBlocks.find((candidate) => candidate.id === blockId);
  return block ? getBlockText(block) : '';
};

export const ReviewPage = ({ reviewPayload }: ReviewPageProps) => {
  const reviewDataReady = Boolean(
    reviewPayload.normalizedDocument &&
      reviewPayload.mappingPlan &&
      reviewPayload.contentTypes &&
      reviewPayload.contentTypes.length > 0
  );

  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [hoveredDestinationKey, setHoveredDestinationKey] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(null);
  const [modalSelectedEntryIndex, setModalSelectedEntryIndex] = useState(0);
  const [modalSelectedFieldId, setModalSelectedFieldId] = useState('');
  const [excludedBlockIds, setExcludedBlockIds] = useState<Set<string>>(new Set());
  const [rangeAnnotations, setRangeAnnotations] = useState<RangeAnnotation[]>([]);
  const [mappingEntries, setMappingEntries] = useState<MappingEntry[]>(
    reviewPayload.mappingPlan ? cloneMappingEntries(reviewPayload.mappingPlan.entries) : []
  );
  const [selectedEntryIndexes, setSelectedEntryIndexes] = useState<Set<number>>(
    new Set((reviewPayload.mappingPlan?.entries ?? []).map((_, index) => index))
  );

  const contentTypes = reviewPayload.contentTypes ?? [];
  const normalizedDocument = reviewPayload.normalizedDocument;
  const blocks = normalizedDocument?.contentBlocks ?? [];
  const rawDocContent = useMemo(
    () => flattenRawDocumentContent(reviewPayload.rawDocJson),
    [reviewPayload.rawDocJson]
  );
  const overviewItems = useMemo(
    () => buildOverviewItems(mappingEntries, reviewPayload.entryHierarchy),
    [mappingEntries, reviewPayload.entryHierarchy]
  );

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

  const renderableDocElements = useMemo<RenderableDocElement[]>(() => {
    if (rawDocContent.length === 0) {
      return blocks.map((block) => ({
        key: block.id,
        blockId: block.id,
        text: getBlockText(block),
        structuralElement: {
          paragraph: {
            paragraphStyle:
              block.type === 'heading'
                ? { namedStyleType: `HEADING_${block.headingLevel ?? 2}` }
                : undefined,
            bullet:
              block.type === 'listItem'
                ? { nestingLevel: block.bullet?.nestingLevel ?? 0 }
                : undefined,
            elements: block.textRuns.map((run) => ({
              textRun: {
                content: run.text,
                textStyle: {
                  bold: run.styles.bold,
                  italic: run.styles.italic,
                  underline: run.styles.underline,
                  link: run.styles.linkUrl ? { url: run.styles.linkUrl } : undefined,
                },
              },
            })),
          },
        },
      }));
    }

    let normalizedBlockIndex = 0;

    return rawDocContent.map((element, index) => {
      if (element.paragraph) {
        const text = getRawParagraphText(element.paragraph);
        const normalizedBlock = blocks[normalizedBlockIndex];
        const blockId = normalizedBlock ? normalizedBlock.id : undefined;

        if (text.length > 0 && normalizedBlock) {
          normalizedBlockIndex += 1;
        }

        return {
          key: `raw-element-${index}`,
          blockId,
          text,
          structuralElement: element,
        };
      }

      return {
        key: `raw-element-${index}`,
        text: '',
        structuralElement: element,
      };
    });
  }, [blocks, rawDocContent]);

  const initialSelectedBlockId =
    renderableDocElements.find(
      (element) => element.blockId && !excludedBlockIds.has(element.blockId)
    )?.blockId ??
    blocks.find((block) => !excludedBlockIds.has(block.id))?.id ??
    null;
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

  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? null;
  const selectedText = selectedRange?.text ?? '';

  const getFieldMapping = (entry: MappingEntry, fieldId: string) =>
    entry.fieldMappings.find((mapping) => mapping.fieldId === fieldId);

  const getDestinationsForBlock = (blockId: string | null) =>
    blockId ? blockDestinations.get(blockId) ?? [] : [];

  const getRangeAnnotationsForBlock = (blockId: string | null) =>
    blockId ? rangeAnnotations.filter((annotation) => annotation.blockId === blockId) : [];

  const findMatchingAnnotation = (blockId: string | null, text: string) =>
    getRangeAnnotationsForBlock(blockId).find((annotation) => annotation.text === text);

  const getBlockStatus = (blockId: string): BlockStatus => {
    if (excludedBlockIds.has(blockId)) return 'excluded';

    const destinations = getDestinationsForBlock(blockId);
    if (destinations.length === 0) return 'unassigned';
    if (destinations.length > 1) return 'multi-mapped';
    return destinations[0].entryIndex === selectedEntryIndex ? 'current-entry' : 'other-entry';
  };

  const selectedBlockFullText = getRenderableTextByBlockId(
    renderableDocElements,
    blocks,
    selectedBlockId
  );
  const selectedAnnotation = findMatchingAnnotation(
    selectedRange?.blockId ?? selectedBlockId,
    selectedText
  );
  const selectedBlockDestinations =
    selectedAnnotation?.destinations ??
    (selectedRange && selectedRange.text !== selectedBlockFullText
      ? []
      : getDestinationsForBlock(selectedBlockId));
  const selectedBlockStatus = selectedAnnotation?.excluded
    ? 'excluded'
    : selectedAnnotation
    ? selectedAnnotation.destinations.length > 1
      ? 'multi-mapped'
      : selectedAnnotation.destinations.length === 0
      ? 'unassigned'
      : selectedAnnotation.destinations[0].entryIndex === selectedEntryIndex
      ? 'current-entry'
      : 'other-entry'
    : selectedBlockId
    ? getBlockStatus(selectedBlockId)
    : 'unassigned';

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

    if (
      selectedRange &&
      selectedRange.text.length > 0 &&
      selectedRange.text !== selectedBlockFullText
    ) {
      const contentType = contentTypeById.get(mappingEntries[targetEntryIndex]?.contentTypeId);
      const entryLabel = getContentTypeLabel(contentType);
      const destination: BlockDestination = {
        key: `range:${targetEntryIndex}:${targetField.id}:${selectedBlockId}:${selectedRange.text}`,
        entryIndex: targetEntryIndex,
        contentTypeId: mappingEntries[targetEntryIndex].contentTypeId,
        entryLabel,
        fieldId: targetField.id,
        fieldLabel: targetField.name || targetField.id,
        fieldType: targetField.type,
        blockId: selectedBlockId,
      };

      setRangeAnnotations((current) => {
        const existing = current.filter(
          (annotation) =>
            !(annotation.blockId === selectedBlockId && annotation.text === selectedRange.text)
        );

        return [
          ...existing,
          {
            id: `range-${selectedBlockId}-${selectedRange.text}`,
            blockId: selectedBlockId,
            text: selectedRange.text,
            destinations: [destination],
          },
        ];
      });
      setSelectedEntryIndex(targetEntryIndex);
      setAssignmentMode(null);
      window.getSelection?.()?.removeAllRanges?.();
      return;
    }

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
    const selection = window.getSelection?.();
    selection?.removeAllRanges?.();
  };

  const handleExclude = () => {
    if (!selectedBlockId) return;

    if (
      selectedRange &&
      selectedRange.text.length > 0 &&
      selectedRange.text !== selectedBlockFullText
    ) {
      setRangeAnnotations((current) => {
        const existing = current.filter(
          (annotation) =>
            !(annotation.blockId === selectedBlockId && annotation.text === selectedRange.text)
        );

        return [
          ...existing,
          {
            id: `range-${selectedBlockId}-${selectedRange.text}`,
            blockId: selectedBlockId,
            text: selectedRange.text,
            destinations: [],
            excluded: true,
          },
        ];
      });
      setAssignmentMode(null);
      window.getSelection?.()?.removeAllRanges?.();
      return;
    }

    setMappingEntries((currentEntries) => {
      const nextEntries = cloneMappingEntries(currentEntries);
      removeBlockFromAllMappings(nextEntries, selectedBlockId);
      return nextEntries;
    });
    setExcludedBlockIds((current) => new Set(current).add(selectedBlockId));
    setAssignmentMode(null);
    const selection = window.getSelection?.();
    selection?.removeAllRanges?.();
  };

  const handleRestore = () => {
    if (!selectedBlockId) return;

    if (
      selectedRange &&
      selectedRange.text.length > 0 &&
      selectedRange.text !== selectedBlockFullText
    ) {
      setRangeAnnotations((current) =>
        current.filter(
          (annotation) =>
            !(annotation.blockId === selectedBlockId && annotation.text === selectedRange.text)
        )
      );
      return;
    }

    setExcludedBlockIds((current) => {
      const next = new Set(current);
      next.delete(selectedBlockId);
      return next;
    });
  };

  const handleBlockClick = (blockId: string) => {
    const selection = window.getSelection?.();
    const nextSelectedText = selection?.toString().trim() ?? '';
    const destinations = getDestinationsForBlock(blockId);
    const onlyMappedElsewhere =
      destinations.length === 1 && destinations[0].entryIndex !== selectedEntryIndex;

    setSelectedBlockId(blockId);
    setAssignmentMode(null);

    if (nextSelectedText.length === 0 && onlyMappedElsewhere) {
      setSelectedEntryIndex(destinations[0].entryIndex);
    }

    if (nextSelectedText.length === 0) {
      setSelectedRange(null);
    }
  };

  const renderDestinationCards = (blockId: string, destinations: BlockDestination[]) => (
    <div style={pageStyles.markerRail}>
      {destinations.map((destination) => {
        const isHovered = hoveredDestinationKey === destination.key || hoveredBlockId === blockId;

        return (
          <div
            key={destination.key}
            style={{
              ...pageStyles.destinationCard,
              borderColor: isHovered ? tokens.green600 : tokens.gray300,
              background: isHovered ? tokens.green100 : tokens.gray100,
            }}
            onMouseEnter={() => {
              setHoveredBlockId(blockId);
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

  useEffect(() => {
    if (!assignmentMode) {
      setModalSelectedFieldId('');
      return;
    }

    const fallbackEntryIndex = selectedBlockDestinations[0]?.entryIndex ?? selectedEntryIndex ?? 0;
    const safeEntryIndex = Math.min(fallbackEntryIndex, Math.max(mappingEntries.length - 1, 0));
    const entry = mappingEntries[safeEntryIndex];
    const contentType = contentTypeById.get(entry?.contentTypeId ?? '');
    const firstFieldId = contentType?.fields[0]?.id ?? '';

    setModalSelectedEntryIndex(safeEntryIndex);
    setModalSelectedFieldId(firstFieldId);
  }, [
    assignmentMode,
    contentTypeById,
    mappingEntries,
    selectedBlockDestinations,
    selectedEntryIndex,
  ]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection?.();
      const nextSelectedText = selection?.toString().trim() ?? '';
      const anchorElement = getNodeElement(selection?.anchorNode ?? null);
      const blockElement = anchorElement?.closest('[data-source-block-id]');
      const blockId = blockElement?.getAttribute('data-source-block-id');

      if (!blockId || nextSelectedText.length === 0) {
        setSelectedRange(null);
        return;
      }

      setSelectedBlockId(blockId);
      setSelectedRange({ blockId, text: nextSelectedText });
      setAssignmentMode(null);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const renderStructuralElement = (element: GoogleDocsRawStructuralElement, blockId?: string) => {
    if (element.sectionBreak) return null;

    if (element.table) {
      const rows = element.table.tableRows ?? [];

      return (
        <table style={pageStyles.docTable}>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`table-row-${rowIndex}`}>
                {(row.tableCells ?? []).map((cell, cellIndex) => (
                  <td key={`table-cell-${rowIndex}-${cellIndex}`} style={pageStyles.docTableCell}>
                    {getRawTableCellText(cell.content)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    const paragraph = element.paragraph;
    if (!paragraph) return null;

    const namedStyleType = paragraph.paragraphStyle?.namedStyleType ?? 'NORMAL_TEXT';
    const headingMatch = namedStyleType.match(/^HEADING_(\d)$/);
    const headingLevel = headingMatch ? Number(headingMatch[1]) : undefined;

    if (headingLevel) {
      const HeadingTag = getHeadingTag(headingLevel);
      const text = getRawParagraphText(paragraph);
      return (
        <HeadingTag
          style={{
            ...pageStyles.docHeading,
            fontSize:
              headingLevel === 1
                ? tokens.fontSizeXl
                : headingLevel === 2
                ? tokens.fontSizeL
                : tokens.fontSizeM,
          }}>
          {renderParagraphContent(
            reviewPayload.rawDocJson,
            paragraph.elements,
            blockId,
            text,
            renderAnnotatedText
          )}
        </HeadingTag>
      );
    }

    if (paragraph.bullet) {
      const text = getRawParagraphText(paragraph);
      return (
        <div style={pageStyles.docListItem}>
          <span style={pageStyles.docBullet}>•</span>
          <p style={pageStyles.docParagraph}>
            {renderParagraphContent(
              reviewPayload.rawDocJson,
              paragraph.elements,
              blockId,
              text,
              renderAnnotatedText
            )}
          </p>
        </div>
      );
    }

    const text = getRawParagraphText(paragraph);
    return (
      <p style={pageStyles.docParagraph}>
        {renderParagraphContent(
          reviewPayload.rawDocJson,
          paragraph.elements,
          blockId,
          text,
          renderAnnotatedText
        )}
      </p>
    );
  };

  const renderAnnotatedText = (blockId: string, text: string) => {
    const annotations = getRangeAnnotationsForBlock(blockId).filter(
      (annotation) => annotation.text.length > 0
    );

    if (annotations.length === 0) {
      return <span>{text}</span>;
    }

    const segments: Array<{ text: string; annotation?: RangeAnnotation }> = [];
    let cursor = 0;

    annotations
      .map((annotation) => ({ annotation, start: text.indexOf(annotation.text) }))
      .filter((match) => match.start >= 0)
      .sort((a, b) => a.start - b.start)
      .forEach(({ annotation, start }) => {
        if (start > cursor) {
          segments.push({ text: text.slice(cursor, start) });
        }
        segments.push({ text: annotation.text, annotation });
        cursor = start + annotation.text.length;
      });

    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor) });
    }

    return segments.map((segment, index) => {
      if (!segment.annotation) {
        return <span key={`${blockId}-segment-${index}`}>{segment.text}</span>;
      }

      return (
        <span
          key={`${blockId}-segment-${index}`}
          style={{
            background: segment.annotation.excluded ? tokens.gray200 : tokens.green100,
            border: `1px solid ${segment.annotation.excluded ? tokens.gray500 : tokens.green600}`,
            borderRadius: tokens.borderRadiusSmall,
            textDecoration: segment.annotation.excluded ? 'line-through' : undefined,
            padding: '0 2px',
          }}>
          {segment.text}
        </span>
      );
    });
  };

  const renderAssignmentModal = () => {
    if (!selectedBlock || !assignmentMode) return null;

    const selectedEntry = mappingEntries[modalSelectedEntryIndex];
    const selectedContentType = contentTypeById.get(selectedEntry?.contentTypeId ?? '');
    const availableFields = selectedContentType?.fields ?? [];
    const selectedField =
      availableFields.find((field) => field.id === modalSelectedFieldId) ?? availableFields[0];
    const selectedFieldMapping =
      selectedEntry && selectedField ? getFieldMapping(selectedEntry, selectedField.id) : undefined;
    const selectedOccupancy = selectedField
      ? getFieldOccupancyLabel(selectedField, selectedFieldMapping)
      : null;
    const selectedSemantics =
      selectedField && selectedOccupancy
        ? getAssignmentSemantics(selectedField, selectedOccupancy)
        : null;

    return (
      <Modal isShown={true} onClose={() => setAssignmentMode(null)} size="large">
        <Modal.Header title="Move content" onClose={() => setAssignmentMode(null)} />
        <Modal.Content>
          <Flex flexDirection="column" gap="spacingM">
            <Paragraph marginBottom="none">
              {assignmentMode === 'assign'
                ? 'Assign the selected text to a field in this creation flow.'
                : 'Move the selected text to a new destination in this creation flow.'}
            </Paragraph>
            <Card padding="default">
              <div style={{ fontWeight: tokens.fontWeightDemiBold }}>
                {selectedText || selectedBlockFullText || getBlockText(selectedBlock)}
              </div>
              <div style={{ ...pageStyles.helperText, marginTop: tokens.spacing2Xs }}>
                Current location:{' '}
                {selectedBlockDestinations.length > 0
                  ? `${selectedBlockDestinations.length} destination${
                      selectedBlockDestinations.length === 1 ? '' : 's'
                    }`
                  : 'Not assigned to a field'}
              </div>
            </Card>
            <FormControl>
              <FormControl.Label htmlFor="move-content-entry">Entry</FormControl.Label>
              <select
                id="move-content-entry"
                aria-label="Entry"
                value={`${modalSelectedEntryIndex}`}
                onChange={(event) => {
                  const nextEntryIndex = Number(event.target.value);
                  const nextEntry = mappingEntries[nextEntryIndex];
                  const nextContentType = contentTypeById.get(nextEntry?.contentTypeId ?? '');
                  setModalSelectedEntryIndex(nextEntryIndex);
                  setModalSelectedFieldId(nextContentType?.fields[0]?.id ?? '');
                }}
                style={{
                  width: '100%',
                  minHeight: '40px',
                  borderRadius: tokens.borderRadiusMedium,
                  border: `1px solid ${tokens.gray400}`,
                  padding: `0 ${tokens.spacingS}`,
                }}>
                {mappingEntries.map((entry, entryIndex) => {
                  const contentType = contentTypeById.get(entry.contentTypeId);
                  return (
                    <option key={`${entry.contentTypeId}-${entryIndex}`} value={`${entryIndex}`}>
                      {getContentTypeLabel(contentType)}
                    </option>
                  );
                })}
              </select>
            </FormControl>

            <FormControl>
              <FormControl.Label htmlFor="move-content-field">Field</FormControl.Label>
              <select
                id="move-content-field"
                aria-label="Field"
                value={selectedField?.id ?? ''}
                onChange={(event) => setModalSelectedFieldId(event.target.value)}
                style={{
                  width: '100%',
                  minHeight: '40px',
                  borderRadius: tokens.borderRadiusMedium,
                  border: `1px solid ${tokens.gray400}`,
                  padding: `0 ${tokens.spacingS}`,
                }}>
                {availableFields.map((field) => {
                  const fieldMapping = selectedEntry
                    ? getFieldMapping(selectedEntry, field.id)
                    : undefined;
                  const occupancy = getFieldOccupancyLabel(field, fieldMapping);

                  return (
                    <option key={field.id} value={field.id}>
                      {(field.name || field.id) + ` (${field.type}) · ${occupancy}`}
                    </option>
                  );
                })}
              </select>
            </FormControl>

            {selectedField && selectedOccupancy && selectedSemantics && (
              <Card padding="default">
                <div style={{ fontWeight: tokens.fontWeightDemiBold }}>
                  {selectedContentType ? getContentTypeLabel(selectedContentType) : 'Destination'}
                </div>
                <div style={{ ...pageStyles.helperText, marginTop: tokens.spacing2Xs }}>
                  {(selectedField.name || selectedField.id) +
                    ` · ${selectedField.type} · ${selectedOccupancy}`}
                </div>
                <div style={{ ...pageStyles.helperText, marginTop: tokens.spacing2Xs }}>
                  This move will {selectedSemantics.toLowerCase()} the selected field.
                </div>
              </Card>
            )}
          </Flex>
        </Modal.Content>
        <Modal.Controls>
          <Button variant="secondary" onClick={() => setAssignmentMode(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (selectedField) {
                handleApplyAssignment(modalSelectedEntryIndex, selectedField);
              }
            }}
            isDisabled={!selectedField}>
            Move content
          </Button>
        </Modal.Controls>
      </Modal>
    );
  };

  const toggleSelectedEntry = (entryIndex: number) => {
    setSelectedEntryIndexes((current) => {
      const next = new Set(current);
      if (next.has(entryIndex)) {
        next.delete(entryIndex);
      } else {
        next.add(entryIndex);
      }
      return next;
    });
  };

  return (
    <Layout variant="fullscreen" withBoxShadow={true} offsetTop={10}>
      <Layout.Body>
        <Flex flexDirection="column" gap="spacingL" style={pageStyles.container}>
          <Heading marginBottom="none">
            {`Create from document "${
              reviewPayload.documentTitle || normalizedDocument.title || 'Untitled document'
            }"`}
          </Heading>

          <Card padding="default">
            <Flex flexDirection="column" gap="spacingM">
              <Flex
                alignItems="center"
                justifyContent="space-between"
                gap="spacingM"
                flexWrap="wrap">
                <div>
                  <Heading as="h2" marginBottom="none">
                    Overview
                  </Heading>
                  <Paragraph marginBottom="none">
                    Review your content and associated entries below. Select which entries you’d
                    like to create.
                  </Paragraph>
                </div>
                <Button variant="primary">
                  {`Create selected entries${
                    selectedEntryIndexes.size > 0 ? ` (${selectedEntryIndexes.size})` : ''
                  }`}
                </Button>
              </Flex>

              <Flex flexDirection="column" gap="spacingS" style={pageStyles.overviewCard}>
                {overviewItems.map(({ entry, entryIndex, depth, key }) => {
                  const contentType = contentTypeById.get(entry.contentTypeId);
                  const entryLabel = getContentTypeLabel(contentType);
                  const entryKind = getEntryKindLabel(contentType);
                  const isSelected = selectedEntryIndex === entryIndex;
                  const isChecked = selectedEntryIndexes.has(entryIndex);

                  return (
                    <div
                      key={`overview-entry-${key}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${entryKind}: ${entryLabel}`}
                      onClick={() => setSelectedEntryIndex(entryIndex)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedEntryIndex(entryIndex);
                        }
                      }}
                      style={{
                        ...pageStyles.overviewEntryCard,
                        marginLeft: depth > 0 ? `${depth * 1.5}rem` : 0,
                        borderColor: isSelected ? tokens.blue500 : tokens.gray300,
                        boxShadow: isSelected ? `0 0 0 1px ${tokens.blue200}` : undefined,
                      }}>
                      <Flex alignItems="center" gap="spacingS">
                        <input
                          aria-label={`Select ${entryKind}: ${entryLabel}`}
                          checked={isChecked}
                          type="checkbox"
                          onChange={() => toggleSelectedEntry(entryIndex)}
                          onClick={(event) => event.stopPropagation()}
                        />
                        <div style={{ fontWeight: tokens.fontWeightDemiBold }}>
                          {`${entryKind}: ${entryLabel}`}
                        </div>
                      </Flex>
                    </div>
                  );
                })}
              </Flex>
            </Flex>
          </Card>

          <Flex flexDirection="column" gap="spacingS">
            <Heading as="h2" marginBottom="none">
              Document outline
            </Heading>
            <Tabs
              currentTab={`${selectedEntryIndex}`}
              onTabChange={(tabId) => setSelectedEntryIndex(Number(tabId))}>
              <Tabs.List
                variant="horizontal-divider"
                style={{
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  whiteSpace: 'nowrap',
                  scrollbarWidth: 'thin',
                }}>
                {mappingEntries.map((entry, entryIndex) => {
                  const contentType = contentTypeById.get(entry.contentTypeId);
                  const label = getContentTypeLabel(contentType);

                  return (
                    <Tabs.Tab
                      key={`${entry.contentTypeId}-${entry.tempId ?? entryIndex}`}
                      panelId={`${entryIndex}`}>
                      {label}
                    </Tabs.Tab>
                  );
                })}
              </Tabs.List>
            </Tabs>
          </Flex>

          <div style={pageStyles.shellGrid}>
            <Card padding="large">
              <Flex flexDirection="column" gap="spacingM">
                {selectedBlock && selectedRange && selectedText && (
                  <div style={pageStyles.selectionToolbar}>
                    <Flex
                      alignItems="center"
                      justifyContent="space-between"
                      gap="spacingM"
                      flexWrap="wrap">
                      <div>
                        <div style={{ fontWeight: tokens.fontWeightDemiBold }}>{selectedText}</div>
                        {selectedBlockDestinations.length > 1 && (
                          <div style={{ ...pageStyles.helperText, marginTop: tokens.spacing2Xs }}>
                            Also used in {selectedBlockDestinations.length - 1} other field
                            {selectedBlockDestinations.length > 2 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <Flex gap="spacingS" flexWrap="wrap">
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
                    </Flex>
                  </div>
                )}

                <div style={pageStyles.documentSurface}>
                  <div style={pageStyles.docFlow}>
                    {renderableDocElements.map((element) => {
                      const blockId = element.blockId;
                      const destinations = blockId ? getDestinationsForBlock(blockId) : [];
                      const status = blockId ? getBlockStatus(blockId) : null;
                      const isSelected = blockId ? selectedBlockId === blockId : false;
                      const isHovered = blockId ? hoveredBlockId === blockId : false;
                      const isMappedToSelectedEntry =
                        status === 'current-entry' || status === 'multi-mapped';
                      const isMappedElsewhere = status === 'other-entry';
                      const isExcluded = status === 'excluded';
                      const hasDestinations = destinations.length > 0;

                      if (!blockId) {
                        return (
                          <div key={element.key}>
                            {renderStructuralElement(element.structuralElement)}
                          </div>
                        );
                      }

                      return (
                        <div key={element.key} style={pageStyles.documentRow}>
                          <div
                            role="button"
                            data-source-block-id={blockId}
                            tabIndex={0}
                            aria-label={element.text || blockId}
                            aria-pressed={isSelected}
                            onClick={() => handleBlockClick(blockId)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedBlockId(blockId);
                                setAssignmentMode(null);
                                setSelectedRange(null);
                              }
                            }}
                            onMouseEnter={() => setHoveredBlockId(blockId)}
                            onMouseLeave={() => setHoveredBlockId(null)}
                            style={{
                              ...pageStyles.blockButton,
                              borderColor: isExcluded
                                ? tokens.red500
                                : hasDestinations && (isSelected || isHovered)
                                ? tokens.green600
                                : hasDestinations && (isMappedToSelectedEntry || isMappedElsewhere)
                                ? tokens.green600
                                : tokens.colorWhite,
                              background:
                                hasDestinations && isMappedToSelectedEntry
                                  ? tokens.green100
                                  : hasDestinations && (isSelected || isHovered)
                                  ? tokens.green100
                                  : tokens.colorWhite,
                              boxShadow:
                                hasDestinations && isSelected
                                  ? `0 0 0 2px ${tokens.green200}`
                                  : undefined,
                            }}>
                            <div style={pageStyles.blockContent}>
                              {renderStructuralElement(element.structuralElement, blockId)}
                            </div>
                          </div>

                          <div>
                            {destinations.length > 0 &&
                              renderDestinationCards(blockId, destinations)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Flex>
            </Card>
          </div>
          {renderAssignmentModal()}
        </Flex>
      </Layout.Body>
    </Layout>
  );
};
