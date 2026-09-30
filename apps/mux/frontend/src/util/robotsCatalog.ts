import { RobotsWorkflow } from './robotsTypes';

/**
 * The Robots workflow catalog: the twelve public workflows as data, with a parameter descriptor
 * per workflow so the run modal renders itself.
 *
 * Only parameters documented in the Robots API reference or guides are listed, and every name,
 * nesting level and enum member here has been checked against them — a wrong parameter name is a
 * 400 the editor cannot act on, and an invented one is worse because it looks supported.
 *
 * Where the reference and a guide disagree on a limit, the stricter figure wins: the looser one
 * only buys a 400 on a job the editor already confirmed.
 *
 * **The reference's rendered *Required* markers are not authoritative for nested objects, and the
 * running API is.** These pages render no required badge on any sub-field of a request-body
 * object, which reads as "every part is optional" and is not what the API enforces: sending
 * `tag_taxonomy` without `allow_other` is rejected with `expected boolean, received undefined`,
 * on a page that marks `allow_other` no differently from anything beside it. Where a sub-field's
 * required-ness matters, send it unconditionally or make the form unable to leave it out — a
 * badge that is not there is not evidence. See ADR-0012.
 *
 * What is deliberately left out, and why:
 *
 * - `summarize`'s and `generate-chapters`' `prompt_overrides`. The reference marks it on both
 *   pages with the same sentence — "Legacy/internal prompt-section overrides. Prefer
 *   output_steering for new integrations." — so exposing it would be building the form against a
 *   surface Mux has already superseded. Nothing in this app sends it; see the test that asserts
 *   no catalog parameter path starts with it.
 * - `edit-captions`'s `auto_censor_profanity.detection_method`, because `llm` is its only
 *   documented value — a select with one option is furniture.
 *
 * `moderate`'s `on_flagged.action` used to be on that list, on the judgement that a parameter
 * which makes the video unplayable is not something to offer behind a checkbox in a CMS. **That
 * decision is reversed.** It is exposed as a select whose default sends nothing, and the risk is
 * carried by `confirmWarning` — a warning the run modal's confirm step must show before the job
 * is created — rather than by leaving the editor without the control. Contentful can now put a
 * playback ID back (ADR-0015), which is what made arming this a complete feature. See ADR-0014.
 *
 * The controlled vocabularies — `find-scenes`' and `find-key-moments`'
 * `output_steering.topic_taxonomy`, `summarize`'s `output_steering.tag_taxonomy` — used to be on
 * that list, on the grounds that they need a bespoke row editor. They are exposed now, through the
 * `taxonomy` kind: the editor names a vocabulary, lists its values and decides whether anything
 * outside it is allowed. Their caps differ per workflow and are declared as data in
 * `taxonomyLimits`, because only `summarize` documents any. See ADR-0012.
 *
 * `find-key-moments`'s `output_steering.rubric_priorities`, `find-best-thumbnails`'s
 * `output_steering.scoring_priorities` and `ask-questions`' `free_form_reply` /
 * `max_free_form_answer_length` used to be on that list and are now exposed — the first two
 * through the `enumList` widget, which picks from the reference's enum rather than accepting free
 * text. That distinction matters: the `find-best-thumbnails` guide's own example passes
 * `scoring_priorities: ["sharp focus", "readable at small sizes"]`, neither of which is an enum
 * member, so a free-text list is a documented way to build an invalid payload.
 *
 * `name` uses dotted paths for nested parameters (`thresholds.sexual`), which
 * `buildRobotsParameters` expands back into the nested object Mux expects. That keeps the form
 * renderer generic instead of special-casing each workflow's shape.
 */

export type RobotsParamKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'language'
  | 'track'
  | 'stringList'
  /** Multi-select over a fixed enum. Never free text — see the header note. */
  | 'enumList'
  | 'questions'
  | 'replacements'
  /** A controlled vocabulary: `topic_taxonomy` / `tag_taxonomy`. */
  | 'taxonomy';

export interface RobotsParamOption {
  value: string;
  label: string;
}

/**
 * What the app knows about the Mux asset itself, as opposed to what the editor typed.
 *
 * Every member is optional and stays optional: a caller that does not know must not have its runs
 * blocked or its controls hidden, so every rule reads an explicit `true` / `false` rather than a
 * falsy value.
 */
export interface RobotsAssetContext {
  hasCaptions?: boolean;
  isAudioOnly?: boolean;
  /** Seconds. Absent for a live stream, whose recorded duration is still growing. */
  duration?: number;
}

/**
 * When a field is rendered — and therefore when it is sent.
 *
 * Two sources, because the two questions are different. `field` asks what the editor has chosen
 * elsewhere in this form; `context` asks what the asset is. The context form is `notEquals` rather
 * than `equals` on purpose: an unknown context is `undefined`, and hiding a usable control on
 * missing information is worse than showing one the API may ignore.
 */
export type RobotsFieldCondition =
  | { field: string; equals: unknown }
  | { context: keyof RobotsAssetContext; notEquals: unknown };

/**
 * The documented caps on one controlled vocabulary, as data.
 *
 * Declared per field rather than per kind because the reference pages genuinely disagree:
 * `summarize`'s `tag_taxonomy` documents six separate limits, while `find-scenes`' and
 * `find-key-moments`' `topic_taxonomy` document none at all. Inventing the missing ones would
 * block runs Mux accepts, so an absent limit here means "the reference states none".
 */
export interface RobotsTaxonomyLimits {
  maxValues?: number;
  maxNameLength?: number;
  maxLabelLength?: number;
  maxDescriptionLength?: number;
  maxAliases?: number;
  maxAliasLength?: number;
  /** Measured over the JSON of the object actually sent. */
  maxSerializedLength?: number;
}

/**
 * A warning the confirm step must show before a run that would arm a destructive parameter.
 *
 * Declared beside the control it belongs to rather than written into the modal, for the same
 * reason `showWhen` is: the catalog is where a parameter's consequences are already recorded, and
 * a warning that lives in component code drifts from the option that triggers it. It is keyed on
 * a value rather than merely on the field being set, because the risk is the value's, not the
 * parameter's — `on_flagged.action` is harmless until it says `delete_playback_ids`.
 *
 * This is not a validation error. The run is legitimate and the editor may well want it; what
 * they must not do is arrive at it without being told, which is the difference between a
 * confirmed decision and a surprise.
 */
export interface RobotsConfirmWarning {
  /** The field value this warning belongs to. */
  whenValue: string;
  title: string;
  body: string;
}

/**
 * A titled group of neighbouring fields in the run form.
 *
 * Presentation only — nothing validated or sent depends on it. Declared on each field and grouped
 * by the renderer over consecutive fields, so a workflow's parameter order stays the one source of
 * layout; `robotsCatalog.test.ts` holds every section's fields together.
 */
export interface RobotsParamSection {
  id: string;
  title: string;
  description?: string;
}

export interface RobotsParamField {
  kind: RobotsParamKind;
  /** Dotted path within the job's `parameters` object. */
  name: string;
  label: string;
  helpText?: string;
  section?: RobotsParamSection;
  isRequired?: boolean;
  placeholder?: string;
  /** `select` and `enumList` only. */
  options?: RobotsParamOption[];
  /** `number` only. */
  min?: number;
  max?: number;
  step?: number;
  /** `track` only — which kind of existing asset track to pick from. */
  trackType?: 'text' | 'audio';
  /** `stringList` and `enumList`. */
  maxItems?: number;
  /** `stringList` only. */
  maxItemLength?: number;
  /** `taxonomy` only — the documented caps, where the reference states any. */
  taxonomyLimits?: RobotsTaxonomyLimits;
  /** The form's starting value. `''` means "untouched", and is never sent. */
  defaultValue?: string | number | boolean;
  /**
   * Render — and send — this parameter only while a condition holds.
   *
   * Kept declarative so the renderer stays generic. A hidden field is never sent: that is what
   * lets `edit-captions` express "do not censor at all" without a synthetic enum member, and what
   * makes a documented cross-field rule unconstructable rather than merely rejected afterwards.
   */
  showWhen?: RobotsFieldCondition;
  /**
   * A form control that shapes the request without being a request parameter itself. Never
   * reaches Mux — `paramsFromFormValues` drops it.
   */
  formOnly?: boolean;
  /** Warnings the confirm step must show, by the value that arms them. */
  confirmWarnings?: RobotsConfirmWarning[];
}

export type RobotsCategory = 'Accessibility' | 'Insights' | 'Structure' | 'Trust & Safety';

export interface RobotsWorkflowDefinition {
  key: RobotsWorkflow;
  label: string;
  category: RobotsCategory;
  description: string;
  params: RobotsParamField[];
  /** Shown as an extra warning in the confirm step. */
  notes?: string[];
  /** Needs Mux Data views accumulated before it has anything to analyse. */
  requiresViewData?: boolean;
  /** Writes a track onto the Mux asset when it completes. */
  producesTrack?: boolean;
  /** Not available on every plan; the app has no entitlement view, so this is informational. */
  planRestricted?: boolean;
  /**
   * Cannot run on an audio-only asset, so the picker offers it disabled there — see
   * `workflowUnavailableReason`. Only a known audio-only asset disables it; an unknown kind
   * offers everything.
   *
   * `find-scenes` is documented: "Audio-only assets are not supported." `find-best-thumbnails`
   * is **a product decision, not a documented restriction**: the reference says nothing about
   * audio-only assets, but the workflow ranks frames and such an asset has none. It is not
   * missing a citation; do not remove it for want of one.
   */
  requiresVideoTrack?: boolean;
}

const LANGUAGE_HELP = 'BCP 47 language code, e.g. en, es, ja.';

/**
 * The label for every workflow's `language_code` that selects which of the asset's caption tracks
 * the workflow reads. It used to be "Caption track language" or "Transcript language", which
 * editors read as the language of the result. Each field's help text says, per the reference,
 * what Mux picks when it is left empty — the rule differs by workflow.
 */
const CAPTIONS_TO_READ_LABEL = 'Captions to read';

/**
 * The label for a select's `''` option.
 *
 * `''` is not an API value: it means "leave this parameter out". It used to read "Default", which
 * claims Mux applies one — and for the steering parameters it is used on, the reference documents
 * no default at all. They are best-effort guidance, so absent means no steering, not some other
 * steering. Preselecting a real enum member instead would silently steer every run toward a
 * preference nobody expressed, so the sentinel stays; only the claim it made is gone.
 *
 * It now covers every `''` option in the catalog. The first pass relabelled three and left seven
 * reading "Default" — `summarize.tone`, `summarize.output_steering.summary_style`,
 * `generate-chapters.output_steering.{chapter_style,chapter_granularity}` and
 * `find-scenes.output_steering.{segmentation_strategy,title_style,narration_detail}`. Each was
 * re-checked against its reference page: all seven are documented as "best-effort" guidance with
 * no default stated, in tables that do say "Defaults to …" where one exists (`tag_count` → 10,
 * `min_scene_duration_ms` → 15000). So none of them gets a preselected value either.
 * `robotsCatalog.test.ts` asserts no select can go back to saying "Default".
 */
const NO_PREFERENCE_LABEL = 'No preference';

/**
 * `output_steering.scope`, which six workflows take in the same shape: "Optional execution window
 * in seconds on the original asset timeline." `validateParams` holds the pair to start < end.
 */
const SCOPE_SECTION: RobotsParamSection = {
  id: 'scope',
  title: 'Part of the video',
  description:
    'Seconds from the start of the video. Leave both empty to use all of it; timestamps in the ' +
    'result are still measured from the start.',
};

const SCOPE_FIELDS: RobotsParamField[] = [
  {
    kind: 'number',
    name: 'output_steering.scope.start_time',
    label: 'Start time (seconds)',
    min: 0,
    step: 1,
    section: SCOPE_SECTION,
  },
  {
    kind: 'number',
    name: 'output_steering.scope.end_time',
    label: 'End time (seconds)',
    min: 0,
    step: 1,
    section: SCOPE_SECTION,
  },
];

const TAGS_SECTION: RobotsParamSection = { id: 'tags', title: 'Tags' };

/** `find-key-moments`' `target_duration_ms`: the API takes both bounds together or neither. */
const HIGHLIGHT_LENGTH_SECTION: RobotsParamSection = {
  id: 'highlight-length',
  title: 'Highlight length',
  description: 'Set both bounds, or neither.',
};

const UPLOAD_TO_MUX: RobotsParamField = {
  kind: 'boolean',
  name: 'upload_to_mux',
  label: 'Attach the result to the Mux asset',
  helpText: 'Leave on to get a real track on the asset. Off returns a temporary download URL only.',
  defaultValue: true,
};

/**
 * `output_steering.topic_taxonomy`, shared by `find-scenes` and `find-key-moments`.
 *
 * One descriptor for both because the parameter is one parameter: `find-scenes` documents the
 * sub-schema in full — `name`, `values[].label` / `.description` / `.aliases`, `allow_other` — and
 * `find-key-moments` lists `topic_taxonomy` under the same `output_steering` object with no
 * sub-schema at all, only its parent's summary ("…audience, taxonomy, and rubric tie-breakers").
 * Neither page documents a single cap, so `taxonomyLimits` is absent rather than borrowed from
 * `summarize`, whose limits belong to a different workflow.
 */
const TOPIC_TAXONOMY: RobotsParamField = {
  kind: 'taxonomy',
  name: 'output_steering.topic_taxonomy',
  label: 'Topic taxonomy',
  helpText:
    'A controlled vocabulary to steer the topics this workflow names. Leave it empty to let the ' +
    'model choose its own.',
};

export const ROBOTS_CATALOG: RobotsWorkflowDefinition[] = [
  {
    key: 'generate-premium-captions',
    label: 'Generate premium captions',
    category: 'Accessibility',
    description: "High-accuracy captions from the video's audio, optionally with speaker labels.",
    producesTrack: true,
    params: [
      {
        kind: 'language',
        name: 'language_code',
        label: 'Spoken language',
        helpText: `Leave empty to auto-detect. ${LANGUAGE_HELP}`,
      },
      {
        // No placeholder: the reference writes the default as `"{Language} (Generated)"`, and
        // shown in the box that read as a template the form would fill in. The help text says
        // what Mux actually does instead.
        kind: 'text',
        name: 'track_name',
        label: 'Track name',
        helpText:
          'Leave empty and Mux names the track after its language — "English (Generated)" for ' +
          'English audio.',
      },
      { kind: 'boolean', name: 'include_speakers', label: 'Label speakers', defaultValue: false },
      {
        kind: 'boolean',
        name: 'include_words',
        label: 'Include word-level timings',
        defaultValue: false,
      },
      {
        // The reference and the guide disagree on the per-phrase limit — 49 characters and at
        // most 5 words in the reference, "up to 50 characters" in the guide. The stricter one is
        // the only safe choice: the looser figure lets through a request the API rejects, and a
        // 400 on a job the editor already confirmed is worse than a field that stops one
        // character early.
        kind: 'stringList',
        name: 'phrases',
        label: 'Phrase hints',
        helpText:
          'Names, jargon or product terms to spell correctly. Up to 100 phrases, each at most ' +
          '5 words and 49 characters.',
        maxItems: 100,
        maxItemLength: 49,
      },
      UPLOAD_TO_MUX,
      {
        // Sits below `upload_to_mux`, and only exists while it is on. The reference: "When false,
        // no track is created and `replace_existing` must also be false; the generated SRT remains
        // available via `temporary_srt_url`." That was checked as an error after the fact, which
        // let the editor tick two independently reasonable boxes and then refused the run. A
        // documented combination that cannot exist is better expressed as one that cannot be
        // built — and a hidden field is never sent, so the request is right either way.
        kind: 'boolean',
        name: 'replace_existing',
        label: 'Replace the existing caption track',
        helpText:
          'Off, a run is rejected when the asset already has a track in this language. On, that ' +
          'track is deleted first.',
        defaultValue: false,
        showWhen: { field: 'upload_to_mux', equals: true },
      },
    ],
  },
  {
    key: 'edit-captions',
    label: 'Edit captions',
    category: 'Accessibility',
    description: 'Apply find/replace rules and profanity filtering to an existing caption track.',
    producesTrack: true,
    // No `notes` here. "Needs at least one replacement rule or a profanity mode" is a validation
    // rule, and `notes` renders in the confirm step — i.e. after the editor has committed.
    // `validateParams` says the same thing where it can still be acted on.
    params: [
      {
        kind: 'track',
        name: 'track_id',
        label: 'Caption track to edit',
        trackType: 'text',
        isRequired: true,
      },
      {
        kind: 'replacements',
        name: 'replacements',
        label: 'Replacements',
        helpText: 'Static find/replace rules applied to the cue text.',
      },
      {
        // Form-only, and the reason the mode select below can finally default to the documented
        // `blank`. The select used to carry a synthetic `''` = "Leave as is", which is what "do
        // not censor at all" meant — a real request, since `replacements` alone is valid. So
        // preselecting `blank` on that select would have censored every run. Splitting the
        // intent out into an explicit opt-in lets both be said: off sends no
        // `auto_censor_profanity` at all, on sends it with a documented mode.
        kind: 'boolean',
        name: 'censor_profanity',
        label: 'Censor profanity',
        helpText: 'Off leaves the words as they are. Replacements still apply either way.',
        defaultValue: false,
        formOnly: true,
      },
      {
        kind: 'select',
        name: 'auto_censor_profanity.mode',
        label: 'How to censor',
        helpText:
          'Blank out writes bracketed underscores, remove drops the text, mask writes question marks.',
        options: [
          { value: 'blank', label: 'Blank out' },
          { value: 'remove', label: 'Remove' },
          { value: 'mask', label: 'Mask' },
        ],
        // The reference's documented default for `mode` when `auto_censor_profanity` is present.
        defaultValue: 'blank',
        showWhen: { field: 'censor_profanity', equals: true },
      },
      {
        kind: 'stringList',
        name: 'auto_censor_profanity.always_censor',
        label: 'Always censor',
        helpText:
          'Words or phrases censored whatever the model decides. One per line; spaces are fine.',
        showWhen: { field: 'censor_profanity', equals: true },
      },
      {
        kind: 'stringList',
        name: 'auto_censor_profanity.never_censor',
        label: 'Never censor',
        helpText: 'Words or phrases left alone. One per line; spaces are fine.',
        showWhen: { field: 'censor_profanity', equals: true },
      },
      {
        kind: 'text',
        name: 'track_name_suffix',
        label: 'Suffix for the new track name',
        helpText: 'Added to the original track’s name. Leave empty for Mux’s default, "edited".',
      },
      UPLOAD_TO_MUX,
      {
        // The same relationship as `generate-premium-captions`' `replace_existing`, one notch
        // weaker: "Has effect only when upload_to_mux is true." Mux ignores it rather than
        // rejecting the run, so nothing was broken — but a checkbox that provably does nothing is
        // still a checkbox that lies, and the `showWhen` mechanism already existed. Its documented
        // default is `true`, which is what applies when it is hidden and therefore unsent; that is
        // also moot, since with no upload there is no replacement track to delete for.
        kind: 'boolean',
        name: 'delete_original_track',
        label: 'Delete the original track',
        helpText: 'The edited track replaces it rather than sitting alongside it.',
        defaultValue: true,
        showWhen: { field: 'upload_to_mux', equals: true },
      },
    ],
  },
  {
    key: 'translate-captions',
    label: 'Translate captions',
    category: 'Accessibility',
    description: 'Translate an existing caption track into another language.',
    producesTrack: true,
    params: [
      {
        kind: 'track',
        name: 'track_id',
        label: 'Source caption track',
        trackType: 'text',
        isRequired: true,
      },
      {
        kind: 'language',
        name: 'to_language_code',
        label: 'Target language',
        helpText: LANGUAGE_HELP,
        isRequired: true,
      },
      {
        // Documented on the reference page only — the guide's parameter table omits it. Exactly
        // the CMS case: brand names and proper nouns that must survive translation.
        kind: 'stringList',
        name: 'never_translate',
        label: 'Never translate',
        helpText:
          'Terms kept verbatim — brand names, product names, proper nouns. One per line. ' +
          'Cannot contain < or >.',
      },
      UPLOAD_TO_MUX,
    ],
  },
  {
    key: 'translate-audio',
    label: 'Translate audio (dub)',
    category: 'Accessibility',
    description: "Translate the video's spoken audio into another language as a new audio track.",
    producesTrack: true,
    planRestricted: true,
    // Two notes, both acted on. The third — "Experimental: Mux may change the parameters,
    // behaviour and pricing" — is gone: it described Mux's roadmap, not this run, and `notes`
    // renders again on the confirm step where an editor can do nothing with it. The entitlement
    // note lost its tail ("there is no way to check beforehand") for the same reason: knowing that
    // nobody can check changes no decision the editor is making.
    notes: [
      'The run is rejected if the video has no audio track, or already has an audio track in ' +
        'the target language.',
      'Dubbing may not be enabled on every account.',
    ],
    params: [
      {
        kind: 'language',
        name: 'to_language_code',
        label: 'Target language',
        helpText: LANGUAGE_HELP,
        isRequired: true,
      },
      UPLOAD_TO_MUX,
    ],
  },
  {
    key: 'summarize',
    label: 'Summarize',
    category: 'Insights',
    description: 'Generate a title, description and tags for the video.',
    params: [
      {
        kind: 'select',
        name: 'tone',
        label: 'Tone',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'neutral', label: 'Neutral' },
          { value: 'playful', label: 'Playful' },
          { value: 'professional', label: 'Professional' },
        ],
        defaultValue: '',
      },
      {
        kind: 'number',
        name: 'title_length',
        label: 'Max title length (words)',
        min: 1,
        step: 1,
      },
      {
        kind: 'number',
        name: 'description_length',
        label: 'Max description length (words)',
        min: 1,
        step: 1,
      },
      {
        // "BCP 47 language code of the caption track to analyze … When omitted, the SDK uses the
        // default track."
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Summarize reads one of this video’s caption tracks. Choose the language of the one ' +
          'to use, or leave empty and Mux picks. The summary’s own language is Output language.',
      },
      {
        kind: 'language',
        name: 'output_language_code',
        label: 'Output language',
        helpText: `Leave empty to write in the captions’ language. ${LANGUAGE_HELP}`,
      },
      {
        kind: 'text',
        name: 'output_steering.audience',
        label: 'Audience',
        placeholder: 'Product marketers',
      },
      {
        kind: 'stringList',
        name: 'output_steering.brand_terms',
        label: 'Brand terms',
        helpText: 'Terminology to prefer in the generated copy.',
      },
      {
        // No documented maximum — the `max: 50` that used to be here was ours, not Mux's.
        kind: 'number',
        name: 'tag_count',
        label: 'Number of tags',
        helpText: 'Defaults to 10.',
        min: 1,
        step: 1,
        section: TAGS_SECTION,
      },
      {
        // The one taxonomy whose caps the reference actually states, all six of them. Unlike
        // `topic_taxonomy`, `allow_other: false` here is documented as a hard filter — "generated
        // tags are filtered to taxonomy labels and aliases" — rather than a preference.
        kind: 'taxonomy',
        name: 'output_steering.tag_taxonomy',
        label: 'Tag taxonomy',
        helpText:
          'A controlled vocabulary for the generated tags. Up to 50 values, and 2000 characters ' +
          'across the whole taxonomy. Leave it empty to let the model choose its own tags.',
        section: TAGS_SECTION,
        taxonomyLimits: {
          maxValues: 50,
          maxNameLength: 100,
          maxLabelLength: 100,
          maxDescriptionLength: 300,
          maxAliases: 10,
          maxAliasLength: 100,
          maxSerializedLength: 2000,
        },
      },
      {
        kind: 'select',
        name: 'output_steering.summary_style',
        label: 'Summary style',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'concise', label: 'Concise' },
          { value: 'detailed', label: 'Detailed' },
          { value: 'editorial', label: 'Editorial' },
        ],
        defaultValue: '',
      },
      ...SCOPE_FIELDS,
      {
        // The counterpart to `update_asset_thumbnail` on find-best-thumbnails, and the most
        // CMS-relevant of the parameters that were missing: it writes the generated title
        // straight onto the Mux asset.
        kind: 'boolean',
        name: 'update_asset_meta',
        label: "Set the asset's title to the generated one",
        helpText: 'Writes `meta.title` on the Mux asset.',
        defaultValue: false,
      },
    ],
  },
  {
    key: 'ask-questions',
    label: 'Ask questions',
    category: 'Insights',
    description: 'Ask questions about the video and get structured answers.',
    params: [
      {
        kind: 'questions',
        name: 'questions',
        label: 'Questions',
        helpText:
          'One row per question, at most 600 characters each. Pick how each one is answered: ' +
          'from a list of options (empty means yes / no, and each option can be up to 150 ' +
          'characters), or in the model’s own words.',
        isRequired: true,
      },
      {
        // Per job, not per question, and only read when some question is answered freely.
        kind: 'number',
        name: 'max_free_form_answer_length',
        label: 'Maximum length of a written answer',
        helpText:
          'Characters, 1–1000. Defaults to 500. Ignored unless a question above is set to ' +
          '“In its own words”.',
        min: 1,
        max: 1000,
        step: 1,
      },
      {
        // Same wording on the reference as `summarize`'s: "When omitted, the SDK uses the default
        // track."
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'The answers come from one of this video’s caption tracks. Choose the language of ' +
          'the one to use, or leave empty and Mux picks.',
      },
      ...SCOPE_FIELDS,
    ],
  },
  {
    key: 'find-key-moments',
    label: 'Find key moments',
    category: 'Insights',
    description: 'Identify the most compelling moments, scored and titled.',
    params: [
      {
        // `use_shots` decides which evidence the workflow selects on, and leaving it out is what
        // made this workflow fail on most assets: the default path uses the transcript, which
        // means the asset must already have a caption track. With shots it uses visual evidence
        // instead and needs no captions — at the cost of generating Mux Shots, which is billed
        // separately from Robots units. Documented in the API reference only; the guide never
        // mentions it, which is how it was missed.
        kind: 'boolean',
        name: 'use_shots',
        label: 'Use visual evidence (Mux Shots)',
        helpText:
          'Off, the video needs a caption track: selection reads the transcript. On, selection ' +
          'reads the picture instead and no captions are needed — at the cost of generating ' +
          'or reusing Mux Shots, billed separately from Robots units. Not supported on ' +
          'audio-only videos, which always read the transcript.',
        defaultValue: false,
      },
      {
        kind: 'number',
        name: 'max_moments',
        // The guide's table says 1–10 default 5 and is stale; the reference schema and the
        // generated SDK both say 1–25, defaulting to 10, or 25 for assets over an hour.
        label: 'Maximum moments',
        helpText: '1–25. Defaults to 10, or 25 for videos over an hour.',
        min: 1,
        max: 25,
        step: 1,
      },
      {
        kind: 'number',
        name: 'target_duration_ms.min',
        label: 'Minimum highlight length (ms)',
        min: 0,
        step: 1000,
        section: HIGHLIGHT_LENGTH_SECTION,
      },
      {
        kind: 'number',
        name: 'target_duration_ms.max',
        label: 'Maximum highlight length (ms)',
        min: 0,
        step: 1000,
        section: HIGHLIGHT_LENGTH_SECTION,
      },
      {
        kind: 'select',
        name: 'output_steering.selection_strategy',
        label: 'What to look for',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'standalone_hooks', label: 'Standalone hooks' },
          { value: 'educational_takeaways', label: 'Educational takeaways' },
          { value: 'story_beats', label: 'Story beats' },
          { value: 'product_moments', label: 'Product moments' },
          { value: 'speaker_highlights', label: 'Speaker highlights' },
        ],
      },
      {
        kind: 'select',
        name: 'output_steering.title_style',
        label: 'Title style',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'descriptive', label: 'Descriptive' },
          { value: 'punchy', label: 'Punchy' },
          { value: 'educational', label: 'Educational' },
          { value: 'social', label: 'Social' },
        ],
      },
      {
        // Max 4 because the enum has exactly four members — the reference states no numeric cap.
        kind: 'enumList',
        name: 'output_steering.rubric_priorities',
        label: 'Tie-breakers',
        helpText: 'Used to choose between moments the strategy above rates equally. Best effort.',
        maxItems: 4,
        options: [
          { value: 'clarity_in_isolation', label: 'Clarity in isolation' },
          { value: 'emotional_intensity', label: 'Emotional intensity' },
          { value: 'novelty', label: 'Novelty' },
          { value: 'soundbite_quality', label: 'Soundbite quality' },
        ],
      },
      { kind: 'text', name: 'output_steering.audience', label: 'Audience' },
      {
        kind: 'stringList',
        name: 'output_steering.brand_terms',
        label: 'Brand terms',
        helpText: 'Terminology to prefer in the generated titles. One per line; spaces are fine.',
      },
      TOPIC_TAXONOMY,
      ...SCOPE_FIELDS,
    ],
    // The two banners that used to live here are gone. Both restated a field's own constraint one
    // scroll away from the field, and `notes` renders again in the confirm step, where a rule the
    // editor can no longer act on is just noise. The length-bounds rule is the description of the
    // section both bounds sit in; the captions rule is help text on `use_shots`, and
    // `validateParams` blocks the run either way.
  },
  {
    key: 'find-best-thumbnails',
    label: 'Find best thumbnails',
    category: 'Insights',
    description: 'Sample and rank frames to pick the strongest thumbnail.',
    // Our decision, not the reference's — see `requiresVideoTrack`.
    requiresVideoTrack: true,
    params: [
      {
        kind: 'number',
        name: 'max_thumbnails',
        label: 'Maximum candidates',
        min: 1,
        // Documented as 1-5. There was no client-side maximum, so 6 became a server rejection
        // the editor had no way to anticipate.
        max: 5,
        step: 1,
        helpText: '1–5. Defaults to 1.',
      },
      {
        kind: 'boolean',
        name: 'update_asset_thumbnail',
        label: "Set the asset's thumbnail to the winner",
        helpText: 'Writes `thumbnail_time` on the Mux asset. Caches may take a while to catch up.',
        defaultValue: false,
      },
      {
        kind: 'select',
        name: 'output_steering.selection_strategy',
        label: 'What makes a good frame here',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'face_or_action', label: 'Face or action' },
          { value: 'clean_composition', label: 'Clean composition' },
          { value: 'high_contrast', label: 'High contrast' },
          { value: 'brand_safe', label: 'Brand safe' },
          { value: 'campaign_thumbnail', label: 'Campaign thumbnail' },
        ],
      },
      {
        // No documented cap, and only five members, so no `maxItems`.
        kind: 'enumList',
        name: 'output_steering.scoring_priorities',
        label: 'Scoring priorities',
        helpText: 'What to weigh when two frames score alike. Best effort.',
        options: [
          { value: 'focus', label: 'Focus' },
          { value: 'face_or_action', label: 'Face or action' },
          { value: 'composition', label: 'Composition' },
          { value: 'contrast_color', label: 'Contrast and colour' },
          { value: 'brand_fit', label: 'Brand fit' },
        ],
      },
      {
        kind: 'text',
        name: 'output_steering.looking_for',
        label: 'Looking for',
        placeholder: 'The presenter holding the product',
      },
      { kind: 'text', name: 'output_steering.audience', label: 'Audience' },
      { kind: 'text', name: 'output_steering.campaign_style', label: 'Campaign style' },
      ...SCOPE_FIELDS,
    ],
  },
  {
    key: 'generate-engagement-insights',
    label: 'Generate engagement insights',
    category: 'Insights',
    description: 'Turn accumulated viewing data into per-moment engagement insights.',
    requiresViewData: true,
    notes: [
      'Needs Mux Data views on this asset. With no views recorded there is nothing to analyse.',
    ],
    params: [],
  },
  {
    key: 'generate-chapters',
    label: 'Generate chapters',
    category: 'Structure',
    description: 'Create timestamped chapters from the video content.',
    params: [
      {
        // "When omitted, the SDK prefers English if available."
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Chapters are made from one of this video’s caption tracks. Choose the language of ' +
          'the one to use, or leave empty and Mux prefers English when there is an English ' +
          'track. The chapter titles’ language is Output language.',
      },
      {
        kind: 'language',
        name: 'output_language_code',
        label: 'Output language',
        helpText: `Leave empty to write in the captions’ language. ${LANGUAGE_HELP}`,
      },
      {
        kind: 'select',
        name: 'output_steering.chapter_style',
        label: 'Chapter style',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'descriptive', label: 'Descriptive' },
          { value: 'punchy', label: 'Punchy' },
          { value: 'educational', label: 'Educational' },
          { value: 'seo', label: 'SEO' },
          { value: 'platform_neutral', label: 'Platform neutral' },
        ],
        defaultValue: '',
      },
      {
        kind: 'select',
        name: 'output_steering.chapter_granularity',
        label: 'Granularity',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'coarse', label: 'Coarse' },
          { value: 'balanced', label: 'Balanced' },
          { value: 'fine', label: 'Fine' },
        ],
        defaultValue: '',
      },
      { kind: 'text', name: 'output_steering.audience', label: 'Audience' },
      {
        kind: 'stringList',
        name: 'output_steering.brand_terms',
        label: 'Brand terms',
      },
      {
        // On by default: putting the chapters on the video is why this workflow is run from a
        // CMS. The reference is explicit that an asset holds a single chapters track, so any
        // existing one is replaced, and that the write is best-effort (`asset_update` in the
        // job's outputs says how it went) — hence the help text.
        kind: 'boolean',
        name: 'update_asset_chapters',
        label: 'Add the chapters to the Mux video',
        helpText:
          'Writes them as the video’s chapters track when the job finishes. Replaces any ' +
          'chapters track the video already has, including one added by hand.',
        defaultValue: true,
      },
    ],
  },
  {
    key: 'find-scenes',
    label: 'Find scenes',
    category: 'Structure',
    description: 'Segment the video into ordered, timestamped scenes.',
    requiresVideoTrack: true,
    params: [
      {
        // "Preferred transcript language code to analyze when a matching transcript track is
        // available. Defaults to the first ready transcript track on the asset."
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Scenes are found from this video’s caption track in that language, if it has one. ' +
          'Leave empty to use the first caption track that is ready.',
      },
      { kind: 'number', name: 'min_scenes', label: 'Minimum scenes (hint)', min: 1, step: 1 },
      {
        kind: 'select',
        name: 'output_steering.segmentation_strategy',
        label: 'How to split the video',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'editorial_beats', label: 'Editorial beats' },
          { value: 'topic_changes', label: 'Topic changes' },
          { value: 'visual_transitions', label: 'Visual transitions' },
          { value: 'action_progression', label: 'Action progression' },
          { value: 'instructional_steps', label: 'Instructional steps' },
        ],
      },
      {
        kind: 'select',
        name: 'output_steering.title_style',
        label: 'Title style',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'descriptive', label: 'Descriptive' },
          { value: 'editorial', label: 'Editorial' },
          { value: 'search_optimized', label: 'Search optimized' },
          { value: 'accessibility', label: 'Accessibility' },
        ],
      },
      {
        kind: 'select',
        name: 'output_steering.narration_detail',
        label: 'Narration detail',
        options: [
          { value: '', label: NO_PREFERENCE_LABEL },
          { value: 'concise', label: 'Concise' },
          { value: 'balanced', label: 'Balanced' },
          { value: 'detailed', label: 'Detailed' },
        ],
      },
      { kind: 'text', name: 'output_steering.audience', label: 'Audience' },
      {
        kind: 'stringList',
        name: 'output_steering.brand_terms',
        label: 'Brand terms',
        helpText: 'One per line.',
      },
      TOPIC_TAXONOMY,
      ...SCOPE_FIELDS,
      {
        kind: 'number',
        name: 'min_scene_duration_ms',
        label: 'Minimum scene length (ms)',
        helpText: 'At least 1000. Defaults to 15000.',
        min: 1000,
        step: 1000,
      },
    ],
  },
  {
    key: 'moderate',
    label: 'Moderate',
    category: 'Trust & Safety',
    description: 'Score sampled frames for sexual and violent content.',
    params: [
      {
        // "Used only for audio-only assets; ignored for video assets with visual content." A
        // control the API is documented to ignore is not worth the row it occupies, so it is
        // hidden once we know this asset has pictures — but only then. `notEquals: false` means an
        // unknown `isAudioOnly` still renders it: hiding a usable control on missing information
        // is the worse failure of the two.
        kind: 'language',
        name: 'language_code',
        label: CAPTIONS_TO_READ_LABEL,
        helpText:
          'Only for an audio-only video, which is moderated from its captions. Choose the ' +
          'language of the caption track to use, or leave empty for the first one that is ready.',
        showWhen: { context: 'isAudioOnly', notEquals: false },
      },
      {
        kind: 'number',
        name: 'thresholds.sexual',
        label: 'Sexual content threshold',
        helpText: '0–1. Defaults to 0.7.',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        kind: 'number',
        name: 'thresholds.violence',
        label: 'Violence threshold',
        helpText: '0–1. Defaults to 0.8.',
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        kind: 'number',
        name: 'sampling_interval',
        label: 'Seconds between samples',
        // Worth stating: this is the one parameter here that drives cost, since moderation is
        // billed per sampled frame rather than per minute.
        helpText:
          'At least 5. Defaults to one sample every 10 seconds. Denser sampling costs more.',
        min: 5,
        step: 1,
      },
      { kind: 'number', name: 'max_samples', label: 'Maximum samples', min: 1, step: 1 },
      ...SCOPE_FIELDS,
      {
        // The whole of `on_flagged`, which is an optional object with exactly one documented
        // field: "Action to take when exceeds_threshold is true." One select carries it, so the
        // `formOnly` + `showWhen` pairing from ADR-0011 is not needed here — there is no second
        // sub-field for a gate to reveal, and `buildRobotsParameters` never creates the parent
        // object for a value it was not given.
        //
        // `delete_playback_ids` is the only value the reference lists. A select with one option
        // is furniture, but this one has two: doing nothing is the other, and it is the default.
        // Exposed after being deliberately omitted — see the header and ADR-0014.
        kind: 'select',
        name: 'on_flagged.action',
        label: 'If the video is flagged',
        helpText:
          'Deleting the playback IDs makes the video unplayable everywhere it is embedded, the ' +
          'moment the job finishes. The asset itself is kept, and the Playback tab can request a ' +
          'new playback ID.',
        options: [
          { value: '', label: 'Do nothing — just record the scores' },
          { value: 'delete_playback_ids', label: 'Delete every playback ID' },
        ],
        defaultValue: '',
        confirmWarnings: [
          {
            whenValue: 'delete_playback_ids',
            title: 'This run can make the video unplayable',
            body:
              'If the content scores over a threshold, Mux deletes every playback ID on this ' +
              'asset. Playback stops everywhere it is embedded, not just in Contentful, and ' +
              'anything that needs a playback ID breaks with it — including the other workflows ' +
              'of a directive run on this asset. The asset, its captions and everything recorded ' +
              'on this entry are kept, and the Playback tab can request a new playback ID, which ' +
              'is applied when you publish.',
          },
        ],
      },
    ],
  },
];

export const ROBOTS_CATALOG_BY_KEY: Record<RobotsWorkflow, RobotsWorkflowDefinition> =
  ROBOTS_CATALOG.reduce((acc, definition) => {
    acc[definition.key] = definition;
    return acc;
  }, {} as Record<RobotsWorkflow, RobotsWorkflowDefinition>);

export const ROBOTS_CATEGORIES: RobotsCategory[] = [
  'Accessibility',
  'Insights',
  'Structure',
  'Trust & Safety',
];

export function workflowLabel(workflow: string): string {
  return ROBOTS_CATALOG_BY_KEY[workflow as RobotsWorkflow]?.label ?? workflow;
}

/** What the run form opens on. */
export const DEFAULT_ROBOTS_WORKFLOW: RobotsWorkflow = 'summarize';

/** Why this asset cannot run a workflow, as the picker's suffix — or `undefined` when it can. */
export function workflowUnavailableReason(
  definition: RobotsWorkflowDefinition,
  context: RobotsAssetContext = {}
): string | undefined {
  return definition.requiresVideoTrack && context.isAudioOnly === true
    ? 'not available for audio-only'
    : undefined;
}

/**
 * The workflow the form should hold: `preferred` if this asset can run it, the default otherwise.
 * What keeps an unavailable workflow off the screen — preselected, or picked before the asset
 * turned out to be audio-only. The default runs on any asset; a catalog test holds it to that.
 */
export function availableWorkflow(
  preferred: RobotsWorkflow,
  context: RobotsAssetContext = {}
): RobotsWorkflow {
  return workflowUnavailableReason(ROBOTS_CATALOG_BY_KEY[preferred], context)
    ? DEFAULT_ROBOTS_WORKFLOW
    : preferred;
}

/**
 * Expands the flat, dotted-path form values into the nested `parameters` object Mux expects, and
 * drops anything the editor left alone.
 *
 * Empty strings, empty arrays and `undefined` are dropped rather than sent: `""` is not a valid
 * language code or enum member, and sending it turns an untouched optional field into a 400.
 */
export function buildRobotsParameters(
  assetId: string,
  values: Record<string, unknown>
): Record<string, unknown> {
  const parameters: Record<string, unknown> = { asset_id: assetId };

  for (const [path, rawValue] of Object.entries(values)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') continue;
    if (Array.isArray(rawValue) && rawValue.length === 0) continue;

    const segments = path.split('.');
    let target = parameters;
    for (const segment of segments.slice(0, -1)) {
      if (typeof target[segment] !== 'object' || target[segment] === null) {
        target[segment] = {};
      }
      target = target[segment] as Record<string, unknown>;
    }
    target[segments[segments.length - 1]] = rawValue;
  }

  return parameters;
}

// --- Form <-> API translation ---
//
// Two workflows take arrays of objects rather than scalars. Their rows are edited as flat strings
// in the form and converted here, so the renderer stays generic and the conversion is testable
// without mounting a component.

/**
 * One `ask-questions` row.
 *
 * `answerMode` exists because the two API fields it stands for are mutually exclusive:
 * `answer_options` and `free_form_reply` cannot both be sent. Two independent inputs would let
 * the editor fill both and find out from a 400, and would also leave "answer freely" and "use the
 * yes / no default" sharing one empty options box. A mode per row makes them separate intents.
 */
export interface QuestionRow {
  question: string;
  answerOptions: string;
  answerMode?: 'options' | 'free_form';
}

export const QUESTION_ANSWER_MODES: RobotsParamOption[] = [
  { value: 'options', label: 'From a list' },
  { value: 'free_form', label: 'In its own words' },
];

/** A fresh, empty question row. */
export const emptyQuestionRow = (): QuestionRow => ({
  question: '',
  answerOptions: '',
  answerMode: 'options',
});

export interface ReplacementRow {
  find: string;
  replace: string;
  caseSensitive: boolean;
}

/**
 * One row of a controlled vocabulary.
 *
 * `aliases` is a comma-separated string rather than an array for the same reason
 * `QuestionRow.answerOptions` is: the row is edited as flat text and split on the way out, so the
 * renderer needs no per-cell list widget and the conversion is testable without mounting one.
 */
export interface TaxonomyRow {
  label: string;
  description: string;
  aliases: string;
}

/**
 * One whole `topic_taxonomy` / `tag_taxonomy` object, as the form holds it.
 *
 * Edited as a single field rather than three dotted paths (`…taxonomy.name`, `…taxonomy.values`,
 * `…taxonomy.allow_other`) because the object is atomic to the API: a name with no values is a
 * controlled vocabulary that controls nothing, and `summarize` documents `values` as "Supports
 * 1-50 values" — a lower bound of one. Keeping it in one field is what lets `toApiParamValue` send
 * the whole thing or none of it, which is also what keeps `allow_other` from ever being sent on
 * its own.
 *
 * `allowOther` is a plain boolean, and always sent with the object. It used to be a tri-state
 * string whose empty member omitted the key, on the reading that no page marks `allow_other`
 * Required — but the running API rejects the object without it (`expected boolean, received
 * undefined`), so "absent" was never one of the outcomes. It defaults to `true`: `false` is
 * documented on `summarize` as a hard filter, "generated tags are filtered to taxonomy labels and
 * aliases", and an editor who adds a vocabulary without touching this control must not have the
 * rest of the model's output silently discarded for it.
 */
export interface TaxonomyValue {
  name: string;
  allowOther: boolean;
  values: TaxonomyRow[];
}

export const emptyTaxonomyRow = (): TaxonomyRow => ({
  label: '',
  description: '',
  aliases: '',
});

export const emptyTaxonomyValue = (): TaxonomyValue => ({
  name: '',
  allowOther: true,
  values: [],
});

/** Reads an unknown form value as a `TaxonomyValue`, so every consumer sees the same shape. */
export function asTaxonomyValue(value: unknown): TaxonomyValue {
  const partial = (value ?? {}) as Partial<TaxonomyValue>;
  return {
    name: typeof partial.name === 'string' ? partial.name : '',
    // Anything that is not a boolean reads as `true`, which covers both an untouched field and a
    // form value stored before this was a checkbox.
    allowOther: typeof partial.allowOther === 'boolean' ? partial.allowOther : true,
    values: Array.isArray(partial.values) ? partial.values : [],
  };
}

/** Splits a row's comma-separated aliases box into trimmed, non-empty aliases. */
function taxonomyAliases(row: TaxonomyRow): string[] {
  return (row.aliases ?? '')
    .split(',')
    .map((alias) => alias.trim())
    .filter(Boolean);
}

/** The form's starting values: only the defaults the catalog declares. */
export function defaultParamValues(fields: RobotsParamField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.kind === 'questions') {
      values[field.name] = [emptyQuestionRow()] as QuestionRow[];
      continue;
    }
    if (field.defaultValue !== undefined) values[field.name] = field.defaultValue;
  }
  return values;
}

/**
 * Whether a `showWhen` field's condition is met. A field with no `showWhen` is always visible.
 *
 * Visibility is not only cosmetic: an invisible field is not sent, which is how "do not censor at
 * all" is expressed without a synthetic enum member.
 */
export function isFieldVisible(
  field: RobotsParamField,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {}
): boolean {
  const condition = field.showWhen;
  if (!condition) return true;
  if ('context' in condition) return context[condition.context] !== condition.notEquals;
  return values[condition.field] === condition.equals;
}

export interface RobotsFieldGroup {
  section?: RobotsParamSection;
  fields: RobotsParamField[];
}

/** Consecutive fields that share a section become one group; every other field stands alone. */
export function groupFieldsBySection(fields: RobotsParamField[]): RobotsFieldGroup[] {
  const groups: RobotsFieldGroup[] = [];
  for (const field of fields) {
    const last = groups[groups.length - 1];
    if (field.section && last?.section?.id === field.section.id) last.fields.push(field);
    else groups.push({ section: field.section, fields: [field] });
  }
  return groups;
}

/** Splits an `ask-questions` row's comma-separated options box into trimmed, non-empty options. */
function questionAnswerOptions(row: QuestionRow): string[] {
  return (row.answerOptions ?? '')
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
}

/** Turns one form value into what the Robots API expects, or `undefined` to omit it. */
export function toApiParamValue(field: RobotsParamField, value: unknown): unknown {
  if (field.kind === 'questions') {
    const rows = Array.isArray(value) ? (value as QuestionRow[]) : [];
    const questions = rows
      .filter((row) => row.question.trim() !== '')
      .map((row) => {
        const question = row.question.trim();
        // Exactly one of the two, never both: the reference documents them as mutually
        // exclusive, so a row in free-form mode drops whatever is still sitting in its options
        // box rather than sending a pair the API rejects.
        if (row.answerMode === 'free_form') return { question, free_form_reply: true };
        const options = questionAnswerOptions(row);
        return options.length > 0 ? { question, answer_options: options } : { question };
      });
    return questions.length > 0 ? questions : undefined;
  }

  if (field.kind === 'replacements') {
    const rows = Array.isArray(value) ? (value as ReplacementRow[]) : [];
    const replacements = rows
      .filter((row) => row.find.trim() !== '')
      .map((row) => ({
        find: row.find,
        replace: row.replace,
        ...(row.caseSensitive && { case_sensitive: true }),
      }));
    return replacements.length > 0 ? replacements : undefined;
  }

  if (field.kind === 'taxonomy') {
    const taxonomy = asTaxonomyValue(value);
    const taxonomyValues = taxonomy.values
      .filter((row) => (row.label ?? '').trim() !== '')
      .map((row) => {
        const aliases = taxonomyAliases(row);
        const description = (row.description ?? '').trim();
        return {
          label: row.label.trim(),
          ...(description !== '' && { description }),
          ...(aliases.length > 0 && { aliases }),
        };
      });
    // No values, no vocabulary. A name on its own describes a list that is not there —
    // `validateParams` says so rather than letting the object go out half-built.
    if (taxonomyValues.length === 0) return undefined;
    const name = taxonomy.name.trim();
    // `allow_other` is unconditional: the API rejects the object without it. `name` stays
    // conditional — see the note above `TaxonomyValue`.
    return {
      ...(name !== '' && { name }),
      values: taxonomyValues,
      allow_other: taxonomy.allowOther,
    };
  }

  // An untouched optional field must not be sent: `""` is not a valid enum member or language
  // code, and sending it turns "I left this alone" into a 400.
  //
  // That check is the whole of it. There used to be a second one dropping any value still equal
  // to `field.defaultValue`, which was only ever reachable for `''` defaults — and would now be
  // actively wrong: `edit-captions`' `auto_censor_profanity.mode` defaults to `blank`, a
  // documented API value, and dropping it would send an `auto_censor_profanity` object with no
  // mode in it.
  if (value === '' || value === undefined || value === null) return undefined;
  return value;
}

/** Builds the job's `parameters` from the form's flat values. */
export function paramsFromFormValues(
  definition: RobotsWorkflowDefinition,
  assetId: string,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {}
): Record<string, unknown> {
  const apiValues: Record<string, unknown> = {};
  for (const field of definition.params) {
    if (field.formOnly) continue;
    if (!isFieldVisible(field, values, context)) continue;
    const apiValue = toApiParamValue(field, values[field.name]);
    if (apiValue !== undefined) apiValues[field.name] = apiValue;
  }
  return buildRobotsParameters(assetId, apiValues);
}

/**
 * The warnings the confirm step must show for what this form currently describes.
 *
 * Read off the same values and the same `isFieldVisible` predicate that decide what is sent, so a
 * parameter cannot be armed without its warning or warned about after being hidden. Derived rather
 * than stored: the editor can go back from the confirm step, change the select and return.
 */
export function confirmWarnings(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  context: RobotsAssetContext = {}
): RobotsConfirmWarning[] {
  const warnings: RobotsConfirmWarning[] = [];
  for (const field of definition.params) {
    if (!field.confirmWarnings) continue;
    if (!isFieldVisible(field, values, context)) continue;
    // No `?? ''` fallback: a field with no value and no default is `undefined`, which matches no
    // `whenValue` — which is the right answer, and one branch fewer than spelling it out.
    const value = values[field.name] ?? field.defaultValue;
    warnings.push(...field.confirmWarnings.filter((warning) => warning.whenValue === value));
  }
  return warnings;
}

/**
 * The documented caps on one controlled vocabulary, checked against what would actually be sent.
 *
 * Only limits the field declares are enforced. `find-scenes` and `find-key-moments` document none
 * for `topic_taxonomy`, and a cap invented for them would block a run Mux accepts.
 */
function taxonomyErrors(field: RobotsParamField, formValue: unknown, apiValue: unknown): string[] {
  const errors: string[] = [];
  const taxonomy = asTaxonomyValue(formValue);

  if (apiValue === undefined) {
    // Nothing is sent, so nothing can be over a cap — but if the editor named the vocabulary,
    // silently dropping their work is exactly what this codebase keeps having to undo.
    //
    // `allowOther` is no longer part of this test. As a boolean it always holds one of its two
    // values, so it can no longer distinguish "the editor decided something here" from "untouched".
    if (taxonomy.name.trim() !== '') {
      errors.push(`${field.label}: add at least one value, or clear the taxonomy name.`);
    }
    return errors;
  }

  const limits = field.taxonomyLimits;
  if (!limits) return errors;

  const sent = apiValue as {
    name?: string;
    values: Array<{ label: string; description?: string; aliases?: string[] }>;
  };

  if (limits.maxValues !== undefined && sent.values.length > limits.maxValues) {
    errors.push(`${field.label}: at most ${limits.maxValues} values.`);
  }
  if (
    limits.maxNameLength !== undefined &&
    sent.name !== undefined &&
    sent.name.length > limits.maxNameLength
  ) {
    errors.push(`${field.label}: the taxonomy name is at most ${limits.maxNameLength} characters.`);
  }

  for (const row of sent.values) {
    if (limits.maxLabelLength !== undefined && row.label.length > limits.maxLabelLength) {
      errors.push(
        `${field.label}: a value is at most ${
          limits.maxLabelLength
        } characters — "${row.label.slice(0, 40)}…".`
      );
      break;
    }
  }
  for (const row of sent.values) {
    if (
      limits.maxDescriptionLength !== undefined &&
      (row.description?.length ?? 0) > limits.maxDescriptionLength
    ) {
      errors.push(
        `${field.label}: the description of "${row.label}" is at most ${limits.maxDescriptionLength} characters.`
      );
      break;
    }
  }
  for (const row of sent.values) {
    if (limits.maxAliases !== undefined && (row.aliases?.length ?? 0) > limits.maxAliases) {
      errors.push(`${field.label}: "${row.label}" has more than ${limits.maxAliases} aliases.`);
      break;
    }
  }
  const maxAliasLength = limits.maxAliasLength;
  for (const row of sent.values) {
    const longAlias =
      maxAliasLength === undefined
        ? undefined
        : (row.aliases ?? []).find((alias) => alias.length > maxAliasLength);
    if (longAlias !== undefined) {
      errors.push(
        `${field.label}: an alias is at most ${
          limits.maxAliasLength
        } characters — "${longAlias.slice(0, 40)}…".`
      );
      break;
    }
  }

  // "Supports up to 50 values and 2000 serialized characters." The reference does not say what it
  // serialises, so this measures the JSON of the object we send — the strict reading, and the
  // catalog's standing rule is that the stricter figure wins.
  if (
    limits.maxSerializedLength !== undefined &&
    JSON.stringify(apiValue).length > limits.maxSerializedLength
  ) {
    errors.push(
      `${field.label}: the whole taxonomy is at most ${limits.maxSerializedLength} characters. Shorten the descriptions, or use fewer values.`
    );
  }

  return errors;
}

/** One bound of `output_steering.scope`, when this workflow takes it and the editor set it. */
function scopeBound(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  name: string
): number | undefined {
  const field = definition.params.find((candidate) => candidate.name === name);
  const value = field ? toApiParamValue(field, values[name]) : undefined;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * The execution window, for every workflow that takes one — keyed on the parameters rather than
 * on workflow names, so a workflow that gains a scope gains the rule.
 *
 * A start at or past the end is an empty window: nothing to analyse, and left to Mux it is a
 * refusal after the editor has confirmed. The asset's duration only refuses a *start* past the end
 * of the video. An end past it still leaves a window over real content, and the reference does
 * not say Mux rejects one, so refusing it would be a restriction we invented.
 */
function scopeErrors(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  context: RobotsAssetContext
): string[] {
  const start = scopeBound(definition, values, 'output_steering.scope.start_time');
  const end = scopeBound(definition, values, 'output_steering.scope.end_time');
  const errors: string[] = [];
  if (start !== undefined && end !== undefined && start >= end) {
    errors.push('The start time must be before the end time.');
  }
  if (start !== undefined && context.duration !== undefined && start >= context.duration) {
    errors.push(
      `The start time is past the end of the video, which is ${Number(
        context.duration.toFixed(1)
      )} seconds long.`
    );
  }
  return errors;
}

/**
 * Client-side validation, so an editor sees the problem before a job is billed rather than as a
 * 400 afterwards.
 */
export function validateParams(
  definition: RobotsWorkflowDefinition,
  values: Record<string, unknown>,
  /**
   * What we know about the asset itself, and deliberately optional throughout: a caller that does
   * not know must not have its runs blocked, so every check below tests for an explicit `false` /
   * `true` rather than a falsy value.
   */
  context: RobotsAssetContext = {}
): string[] {
  const errors: string[] = [];

  for (const field of definition.params) {
    if (!isFieldVisible(field, values, context)) continue;
    const apiValue = toApiParamValue(field, values[field.name]);
    if (field.isRequired && apiValue === undefined) {
      errors.push(`${field.label} is required.`);
      continue;
    }
    if (field.kind === 'taxonomy') {
      errors.push(...taxonomyErrors(field, values[field.name], apiValue));
      continue;
    }
    if (apiValue === undefined) continue;
    if (field.kind === 'number' && typeof apiValue === 'number') {
      if (Number.isNaN(apiValue)) errors.push(`${field.label} must be a number.`);
      else if (field.min !== undefined && apiValue < field.min)
        errors.push(`${field.label} must be at least ${field.min}.`);
      else if (field.max !== undefined && apiValue > field.max)
        errors.push(`${field.label} must be at most ${field.max}.`);
    }
    // The list widgets no longer truncate as the editor types — a mid-word `slice` is how "Acme
    // Professional Edition" silently became "Acme Professional Editi". The documented caps are
    // checked here instead, where the editor is told which entry is wrong.
    if ((field.kind === 'stringList' || field.kind === 'enumList') && Array.isArray(apiValue)) {
      if (field.maxItems !== undefined && apiValue.length > field.maxItems) {
        errors.push(`${field.label}: at most ${field.maxItems} entries.`);
      }
      const maxItemLength = field.maxItemLength;
      const tooLong =
        maxItemLength === undefined
          ? undefined
          : (apiValue as unknown[]).find(
              (item) => typeof item === 'string' && item.length > maxItemLength
            );
      if (tooLong !== undefined) {
        errors.push(
          `${field.label}: each entry is at most ${maxItemLength} characters — "${String(
            tooLong
          )}".`
        );
      }
    }
  }

  // `find-key-moments` has a prerequisite that is not a parameter: without `use_shots` the
  // selection reads the transcript, so the asset needs a caption track. Failing that, the POST is
  // accepted and the *job* errors minutes later — the worst shape of failure, because the editor
  // has already been told the run started.
  //
  // On an audio-only asset `use_shots` is no escape hatch: the reference says such assets "always
  // use transcript evidence and require a caption track", so captions are needed whatever the
  // checkbox says.
  if (definition.key === 'find-key-moments') {
    if (context.isAudioOnly === true && values.use_shots === true) {
      errors.push(
        '"Use visual evidence (Mux Shots)" is not supported on audio-only videos. Turn it off.'
      );
    }
    if (
      context.hasCaptions === false &&
      (values.use_shots !== true || context.isAudioOnly === true)
    ) {
      errors.push(
        context.isAudioOnly === true
          ? 'This audio-only video has no caption track, and audio-only videos always read the transcript. Generate captions first.'
          : 'This video has no caption track. Turn on "Use visual evidence (Mux Shots)", or generate captions first.'
      );
    }
  }

  // `generate-chapters` reads the transcript and has no visual fallback — its own
  // `language_code` is "the caption track to analyze" in the reference, i.e. the workflow picks a
  // *caption track*. With none on the asset there is nothing to chapter, the
  // POST is accepted, and the job errors minutes later, by which time the editor has been told
  // the run started and has been charged for finding out. Same prerequisite, same mechanism and
  // same shape of message as `find-key-moments` above; the difference is that chapters has no
  // `use_shots` to turn on, so the only way forward is captions.
  if (definition.key === 'generate-chapters' && context.hasCaptions === false) {
    errors.push(
      'This video has no caption track. Chapters are generated from the transcript, so generate captions first.'
    );
  }

  errors.push(...scopeErrors(definition, values, context));

  // `find-key-moments` requires both bounds together or neither.
  if (definition.key === 'find-key-moments') {
    const min = values['target_duration_ms.min'];
    const max = values['target_duration_ms.max'];
    const hasMin = min !== undefined && min !== '';
    const hasMax = max !== undefined && max !== '';
    if (hasMin !== hasMax) {
      errors.push('Set both highlight length bounds, or neither.');
    } else if (hasMin && hasMax && Number(min) > Number(max)) {
      errors.push('The minimum highlight length cannot exceed the maximum.');
    }
  }

  // `edit-captions` needs something to do: the API requires at least one of `replacements` and
  // `auto_censor_profanity`. Since the profanity object is now gated behind one explicit toggle,
  // that toggle *is* the second half of the condition.
  if (definition.key === 'edit-captions') {
    const replacementsField = definition.params.find((field) => field.kind === 'replacements');
    const hasReplacements =
      replacementsField && toApiParamValue(replacementsField, values[replacementsField.name]);
    if (!hasReplacements && values.censor_profanity !== true) {
      errors.push('Add at least one replacement rule, or turn on "Censor profanity".');
    }
  }

  // `ask-questions` documents two length limits the row editor cannot express.
  if (definition.key === 'ask-questions') {
    const rows = Array.isArray(values.questions) ? (values.questions as QuestionRow[]) : [];
    const longQuestion = rows.find((row) => (row?.question ?? '').trim().length > 600);
    if (longQuestion) {
      errors.push('A question can be at most 600 characters.');
    }
    // Only for rows that actually send options. A free-form row's options are dropped on the way
    // to the API, so blocking the run over one would be a rule about text nobody sends.
    const longOption = rows
      .filter((row) => row?.answerMode !== 'free_form')
      .flatMap((row) => questionAnswerOptions(row ?? emptyQuestionRow()))
      .find((option) => option.length > 150);
    if (longOption) {
      errors.push('An answer option can be at most 150 characters.');
    }
  }

  // `generate-premium-captions`' phrase hints carry two constraints the widget cannot express.
  //
  // The documented `upload_to_mux` / `replace_existing` rule used to be checked here too:
  // "When false, no track is created and `replace_existing` must also be false." It is a real
  // constraint, but an error after the fact was the wrong shape for it — the form let the editor
  // tick two independently reasonable boxes and then refused. `replace_existing` is now hidden
  // behind `showWhen: upload_to_mux === true`, so the combination cannot be built or sent, and the
  // check that remained would have been unreachable.
  if (definition.key === 'generate-premium-captions') {
    // Length and count are checked generically above, from `maxItemLength` / `maxItems`. Word
    // count and the forbidden characters are specific to this parameter.
    const phrases = Array.isArray(values.phrases) ? (values.phrases as unknown[]) : [];
    const tooManyWords = phrases.filter(
      (phrase) => typeof phrase === 'string' && phrase.trim().split(/\s+/).length > 5
    );
    if (tooManyWords.length > 0) {
      errors.push(`Phrase hints can be at most 5 words: "${String(tooManyWords[0])}".`);
    }
    const illegal = phrases.filter(
      (phrase) => typeof phrase === 'string' && /[<>{}[\]]/.test(phrase)
    );
    if (illegal.length > 0) {
      errors.push(`Phrase hints cannot contain < > { } [ ]: "${String(illegal[0])}".`);
    }
  }

  return errors;
}
