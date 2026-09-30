import { FieldExtensionSDK } from '@contentful/app-sdk';
import { RobotsOutputs } from './robotsTypes';

/**
 * Mapping generated Robots output onto the editor's own entry fields.
 *
 * No configuration anywhere: the candidate fields and their types come straight off
 * `sdk.contentType` and `sdk.entry.fields`, both already at hand in the field location. A
 * convention *pre-fills* the choice — the same trick `MetadataConfiguration` already uses to find
 * a `title` field and sync it to the Mux asset — and the apply dialog is itself the mapping UI.
 *
 * The asymmetry that makes this safe: `MetadataConfiguration` only *reads*, so guessing wrong
 * costs nothing. Applying output *writes*, so guessing wrong would overwrite an editor's copy.
 * Hence the convention only suggests; nothing is written without an explicit confirm against a
 * side-by-side preview, and a row starts with no target at all when the suggestion would replace
 * existing content — see `defaultTargetFieldId`.
 *
 * The alternative — per-content-type instance parameters — was ruled out: instance parameter
 * *definitions* live in the App Definition, which Contentful owns and which is not in this repo,
 * and the form Contentful generates from them is free-text boxes where a typo in a field ID fails
 * silently until an editor clicks Apply.
 */

/** The pieces of Robots output that can be written onto an entry field. */
type RobotsOutputKey = 'title' | 'description' | 'tags';

export interface RobotsOutputCandidate {
  key: RobotsOutputKey;
  label: string;
  /** The generated value, in the shape the target field expects. */
  value: string | string[];
  /** Field IDs whose type can hold this value. */
  compatibleFieldIds: string[];
  /** Convention-based suggestion, or undefined when nothing matched. */
  suggestedFieldId?: string;
}

interface EntryFieldOption {
  id: string;
  name: string;
  type: string;
  itemsType?: string;
}

/** Ordered by how specific the name is, so `seoDescription` beats `description` when both exist. */
const CONVENTION: Record<RobotsOutputKey, RegExp[]> = {
  title: [/^title$/i, /^seoTitle$/i, /^metaTitle$/i, /^headline$/i, /^name$/i],
  description: [
    /^seoDescription$/i,
    /^metaDescription$/i,
    /^description$/i,
    /^summary$/i,
    /^excerpt$/i,
    /^abstract$/i,
  ],
  tags: [/^tags$/i, /^keywords$/i, /^topics$/i, /^categories$/i],
};

/**
 * A Rich Text field's value is a *document*, not a string, so it is only writable because
 * `valueForField` converts on the way in. Widening this predicate without that conversion would
 * put a bare string where the entry editor expects a node tree and break the field for the editor.
 */
function canHoldText(field: EntryFieldOption): boolean {
  return field.type === 'Symbol' || field.type === 'Text' || field.type === 'RichText';
}

function canHoldStringList(field: EntryFieldOption): boolean {
  return field.type === 'Array' && (field.itemsType === 'Symbol' || field.itemsType === 'Text');
}

function isCompatible(key: RobotsOutputKey, field: EntryFieldOption): boolean {
  return key === 'tags' ? canHoldStringList(field) : canHoldText(field);
}

/**
 * The shape a Contentful Rich Text field holds.
 *
 * Declared here rather than imported from `@contentful/rich-text-types`: that package is only
 * present as a transitive dependency of `contentful-management`, so importing it would tie this
 * file to someone else's dependency tree for three interfaces. The shape below is copied from that
 * package's `Document`/`Block`/`Text` types (v16.8.5) and matches its exported `EMPTY_DOCUMENT`
 * exactly, `data` and `marks` included — every node carries `data`, and a text node carries
 * `marks`, both required even when empty.
 */
interface RichTextTextNode {
  nodeType: 'text';
  value: string;
  marks: Array<{ type: string }>;
  data: Record<string, unknown>;
}

interface RichTextParagraphNode {
  nodeType: 'paragraph';
  data: Record<string, unknown>;
  content: RichTextTextNode[];
}

export interface RichTextDocument {
  nodeType: 'document';
  data: Record<string, unknown>;
  content: RichTextParagraphNode[];
}

/**
 * The smallest valid document that says `text`: one paragraph, one unmarked text node.
 *
 * Deliberately not clever. A generated description is prose, and splitting it into several
 * paragraphs or inferring marks would be guessing at structure the model never expressed — while a
 * document that does not validate is worse than one that is plain, because Contentful's rich text
 * editor refuses to render a malformed node tree at all.
 */
export function richTextDocument(text: string): RichTextDocument {
  return {
    nodeType: 'document',
    data: {},
    content: [
      {
        nodeType: 'paragraph',
        data: {},
        content: [{ nodeType: 'text', value: text, marks: [], data: {} }],
      },
    ],
  };
}

interface UnknownNode {
  nodeType?: unknown;
  value?: unknown;
  content?: unknown;
}

function isNode(value: unknown): value is UnknownNode {
  return typeof value === 'object' && value !== null && 'nodeType' in value;
}

function nodeText(node: UnknownNode): string {
  if (node.nodeType === 'text') return typeof node.value === 'string' ? node.value : '';
  if (!Array.isArray(node.content)) return '';
  const parts = node.content.filter(isNode).map(nodeText);
  // Only the top level gets separators: inside a paragraph, consecutive text nodes are one
  // sentence split by marks, and joining those with a space would invent whitespace.
  return node.nodeType === 'document'
    ? parts.filter((part) => part !== '').join(' ')
    : parts.join('');
}

/**
 * The readable text inside a Rich Text value, or `undefined` when this is not one.
 *
 * `undefined` is load-bearing: it is how the callers below tell "a document that happens to be
 * empty" apart from "not a document at all", which decide different things.
 */
export function richTextToPlainText(value: unknown): string | undefined {
  if (!isNode(value) || value.nodeType !== 'document') return undefined;
  return nodeText(value);
}

/**
 * The generated value in the shape the chosen field expects.
 *
 * Every other supported type stores what Robots produced verbatim; Rich Text is the one that has
 * to be wrapped, and it is wrapped here — at the write — rather than on the candidate, because
 * which conversion applies is not known until the editor picks a target.
 */
export function valueForField(value: string | string[], fieldType: string): unknown {
  return fieldType === 'RichText' && typeof value === 'string' ? richTextDocument(value) : value;
}

/**
 * Every field on this entry that could receive generated text, with its human name.
 *
 * The Mux field itself is excluded — it is a JSON object and would never be type-compatible, but
 * being explicit costs nothing and documents the intent.
 */
export function entryFieldOptions(sdk: FieldExtensionSDK): EntryFieldOption[] {
  const namesById = new Map<string, string>();
  for (const contentTypeField of sdk.contentType?.fields ?? []) {
    namesById.set(contentTypeField.id, contentTypeField.name || contentTypeField.id);
  }

  return Object.values(sdk.entry?.fields ?? {})
    .filter((field) => field.id !== sdk.field?.id)
    .map((field) => ({
      id: field.id,
      name: namesById.get(field.id) ?? field.id,
      type: field.type,
      itemsType: field.items?.type,
    }));
}

function suggestFieldId(
  key: RobotsOutputKey,
  compatible: EntryFieldOption[]
): string | undefined {
  for (const pattern of CONVENTION[key]) {
    const match = compatible.find((field) => pattern.test(field.id));
    if (match) return match.id;
  }
  return undefined;
}

/**
 * Turns stored summarize output into the rows the apply dialog renders.
 *
 * Only summarize is mappable: moderation scores are numbers an editor would not paste into a text
 * field, captions and dubs are already Mux tracks, and chapters/scenes/key moments are structured
 * arrays with no natural single-field home.
 */
export function buildOutputCandidates(
  sdk: FieldExtensionSDK,
  outputs: RobotsOutputs | undefined
): RobotsOutputCandidate[] {
  const summary = outputs?.summarize;
  if (!summary) return [];

  const options = entryFieldOptions(sdk);
  const candidates: RobotsOutputCandidate[] = [];

  const push = (key: RobotsOutputKey, label: string, value: string | string[] | undefined) => {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return;
    const compatible = options.filter((field) => isCompatible(key, field));
    candidates.push({
      key,
      label,
      value,
      compatibleFieldIds: compatible.map((field) => field.id),
      suggestedFieldId: suggestFieldId(key, compatible),
    });
  };

  push('title', 'Title', summary.title);
  push('description', 'Description', summary.description);
  push('tags', 'Tags', summary.tags);

  return candidates;
}

export function currentFieldValue(
  sdk: FieldExtensionSDK,
  fieldId: string,
  locale: string
): unknown {
  const field = sdk.entry?.fields?.[fieldId];
  if (!field) return undefined;
  // A field not localized in this content type only has the default locale, and asking it for
  // another one throws.
  const target = field.locales?.includes(locale) ? locale : field.locales?.[0];
  return field.getValue(target);
}

export function formatFieldValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string') return value;
  // A Rich Text field would otherwise preview as a wall of JSON, which tells the editor nothing
  // about what they are being asked to replace.
  const richText = richTextToPlainText(value);
  if (richText !== undefined) return richText;
  return JSON.stringify(value);
}

/**
 * True when the field already holds exactly what we would write.
 *
 * "Has content" and "has *this* content" are different answers, and conflating them is what made
 * the dialog say *"Title already has content. Pick it as the target to replace it"* about a field
 * whose content was the generated title, applied a minute earlier. There is nothing to replace
 * there and nothing to do, and telling someone to overwrite a value with itself is worse than
 * saying nothing.
 *
 * Compared by value, and for Rich Text through its text, because that is the only side of the
 * conversion that survives: `valueForField` wraps a string in a one-paragraph document, so the
 * document we wrote reads back as exactly the string we wrote. A document the editor has since
 * restructured does not, which is correct — it is no longer what we generated.
 */
export function matchesGeneratedValue(current: unknown, generated: string | string[]): boolean {
  if (Array.isArray(generated)) {
    return (
      Array.isArray(current) &&
      current.length === generated.length &&
      current.every((entry, index) => entry === generated[index])
    );
  }
  if (typeof current === 'string') return current === generated;
  return richTextToPlainText(current) === generated;
}

/** True when writing would replace content the editor already has. */
export function wouldOverwrite(current: unknown): boolean {
  if (current === undefined || current === null || current === '') return false;
  if (Array.isArray(current)) return current.length > 0;
  // A Rich Text field the editor merely clicked into holds an empty document, not `undefined`.
  // Treating that as content would refuse to pre-fill a field that is visibly blank.
  const richText = richTextToPlainText(current);
  if (richText !== undefined) return richText.trim() !== '';
  return true;
}

/** The field this output would go to if nothing stood in the way: convention first, then anything compatible. */
export function preferredTargetFieldId(candidate: RobotsOutputCandidate): string {
  return candidate.suggestedFieldId ?? candidate.compatibleFieldIds[0] ?? '';
}

/**
 * The target a row opens on, or `''` for none.
 *
 * The target dropdown is the only control on a row, so pre-filling it *is* consenting to the
 * write. That makes this the place where ADR-0004's rule lives: a suggestion that would replace
 * the editor's own copy is not pre-filled, and choosing it has to be deliberate. The dialog still
 * names the field it declined to fill, so the row is not silently blank.
 */
export function defaultTargetFieldId(
  sdk: FieldExtensionSDK,
  candidate: RobotsOutputCandidate,
  locale: string
): string {
  const fieldId = preferredTargetFieldId(candidate);
  if (!fieldId) return '';
  return wouldOverwrite(currentFieldValue(sdk, fieldId, locale)) ? '' : fieldId;
}

export interface ApplySelection {
  candidate: RobotsOutputCandidate;
  fieldId: string;
}

interface ApplyResult {
  applied: Array<{ fieldId: string; key: RobotsOutputKey }>;
  failed: Array<{ fieldId: string; key: RobotsOutputKey; message: string }>;
}

/**
 * Writes the selected rows onto the entry.
 *
 * Each field is written independently and failures are collected rather than thrown, so one
 * field rejected by a validation does not silently discard the others the editor confirmed.
 */
export async function applyOutputsToEntry(
  sdk: FieldExtensionSDK,
  selections: ApplySelection[],
  locale: string
): Promise<ApplyResult> {
  const result: ApplyResult = { applied: [], failed: [] };

  for (const { candidate, fieldId } of selections) {
    const field = sdk.entry?.fields?.[fieldId];
    if (!field) {
      result.failed.push({ fieldId, key: candidate.key, message: 'Field no longer exists.' });
      continue;
    }
    const target = field.locales?.includes(locale) ? locale : field.locales?.[0];
    try {
      await field.setValue(valueForField(candidate.value, field.type), target);
      result.applied.push({ fieldId, key: candidate.key });
    } catch (error) {
      result.failed.push({
        fieldId,
        key: candidate.key,
        message: error instanceof Error ? error.message : 'Could not write this field.',
      });
    }
  }

  return result;
}
