import type {
  EntryBlockGraphEntry,
  ReviewedReferenceGraph,
  ReviewedReferenceGraphEdge,
  WorkflowContentTypeField,
} from '@types';

type ParentRefField = Pick<WorkflowContentTypeField, 'id' | 'type'>;

/**
 * Links a new child entry onto a parent for a given reference field.
 * - Single Link: replaces existing field value, sourceEntryIds, and graph edges for that field
 * - Array: appends the new child
 */
export function linkChildToParentEntry(args: {
  parentEntry: EntryBlockGraphEntry;
  childTempId: string;
  refField: ParentRefField & { id: string };
  defaultLocale: string;
  previousEdges: ReviewedReferenceGraphEdge[];
}): {
  parentEntry: EntryBlockGraphEntry;
  edges: ReviewedReferenceGraphEdge[];
} {
  const { parentEntry, childTempId, refField, defaultLocale, previousEdges } = args;
  const parentId = parentEntry.tempId;

  if (!parentId) {
    return { parentEntry, edges: previousEdges };
  }

  const isArrayRef = refField.type === 'Array';
  const childRef = { __ref: childTempId };

  const existingLocalized = parentEntry.fields?.[refField.id] ?? {};
  const existingLocales = Object.keys(existingLocalized);
  const localesToWrite = existingLocales.length > 0 ? existingLocales : [defaultLocale];
  const nextLocalized: Record<string, unknown> = { ...existingLocalized };
  for (const locale of localesToWrite) {
    if (isArrayRef) {
      const existingRefs = Array.isArray(nextLocalized[locale])
        ? (nextLocalized[locale] as unknown[])
        : [];
      nextLocalized[locale] = [...existingRefs, childRef];
    } else {
      nextLocalized[locale] = childRef;
    }
  }

  const fieldMappingIndex = parentEntry.fieldMappings.findIndex((fm) => fm.fieldId === refField.id);
  const nextFieldMappings = [...parentEntry.fieldMappings];
  if (fieldMappingIndex >= 0) {
    const fm = nextFieldMappings[fieldMappingIndex];
    const previousIds = fm.sourceEntryIds ?? [];
    nextFieldMappings[fieldMappingIndex] = {
      ...fm,
      sourceEntryIds: isArrayRef ? [...previousIds, childTempId] : [childTempId],
    };
  } else {
    nextFieldMappings.push({
      fieldId: refField.id,
      fieldType: refField.type,
      sourceRefs: [],
      sourceEntryIds: [childTempId],
      confidence: 1,
    });
  }

  const keptEdges = isArrayRef
    ? previousEdges
    : previousEdges.filter((edge) => !(edge.from === parentId && edge.fieldId === refField.id));

  const nextEdges: ReviewedReferenceGraphEdge[] = [
    ...keptEdges,
    { from: parentId, to: childTempId, fieldId: refField.id },
  ];

  return {
    parentEntry: {
      ...parentEntry,
      fields: {
        ...(parentEntry.fields ?? {}),
        [refField.id]: nextLocalized,
      },
      fieldMappings: nextFieldMappings,
    },
    edges: nextEdges,
  };
}

export function withUpdatedReferenceGraph(
  referenceGraph: ReviewedReferenceGraph,
  edges: ReviewedReferenceGraphEdge[]
): ReviewedReferenceGraph {
  return {
    ...referenceGraph,
    edges,
  };
}
