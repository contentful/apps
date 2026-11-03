import { FC, ReactElement, ReactNode } from 'react';
import { Badge, Box, Flex, List, Note, Paragraph, Table, Text } from '@contentful/f36-components';
import { RobotsWorkflow } from '../../util/robotsTypes';
import {
  EM_DASH,
  asRows,
  asStrings,
  formatOutputRange,
  formatScore,
  formatSeconds,
  formatText,
  outputSeconds,
} from '../../util/robotsFormat';
import RobotsJsonBlock from './RobotsJsonBlock';

/**
 * The per-workflow shaped views.
 *
 * Only the outputs editors act on are shaped; the rest fall through to the raw JSON, which is
 * never nothing. Every view declares `hasContent` so that a payload the view cannot read renders
 * the raw result inline rather than an empty table — the bug this feature has shipped three times.
 */

/** A table whose header is a list of strings, because every view here builds one. */
const SimpleTable: FC<{ columns: string[]; children: ReactNode }> = ({ columns, children }) => (
  <Table>
    <Table.Head>
      <Table.Row>
        {columns.map((column) => (
          <Table.Cell key={column}>{column}</Table.Cell>
        ))}
      </Table.Row>
    </Table.Head>
    <Table.Body>{children}</Table.Body>
  </Table>
);

const Labelled: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <Box marginBottom="spacingM">
    <Text fontWeight="fontWeightDemiBold">{label}</Text>
    {children}
  </Box>
);

/**
 * A `find-key-moments` moment's narratives.
 *
 * Both are documented on every moment and either can be empty depending on whether the job ran on
 * visual or transcript evidence — with `use_shots` on, selection reads the picture, so the visual
 * narrative is the one with content. Both are labelled; neither is assumed.
 */
const NarrativeCell: FC<{ audible?: unknown; visual?: unknown; quotable?: string }> = ({
  audible,
  visual,
  quotable,
}) => {
  const parts: Array<[string, string]> = [];
  if (typeof audible === 'string' && audible.trim()) parts.push(['Heard', audible.trim()]);
  if (typeof visual === 'string' && visual.trim()) parts.push(['Seen', visual.trim()]);
  if (quotable) parts.push(['Quote', quotable]);
  if (parts.length === 0) return <>{EM_DASH}</>;

  return (
    <>
      {parts.map(([label, text], index) => (
        <Box key={label} marginBottom={index === parts.length - 1 ? 'none' : 'spacingXs'}>
          <Text fontColor="gray600">{label}: </Text>
          <Text>{text}</Text>
        </Box>
      ))}
    </>
  );
};

/**
 * The two `notable_*_concepts` arrays. They have different shapes on purpose — the audible one is
 * strings, the visual one `{ concept, score, rationale }` — so each is read as what it is.
 */
const ConceptBadges: FC<{ audible?: unknown; visual?: unknown }> = ({ audible, visual }) => {
  const spoken = asStrings(audible);
  const seen = asRows(visual);
  if (spoken.length === 0 && seen.length === 0) return <>{EM_DASH}</>;

  return (
    <Flex gap="spacingXs" flexWrap="wrap">
      {spoken.map((concept) => (
        <Badge key={`a-${concept}`} variant="secondary">
          {concept}
        </Badge>
      ))}
      {seen.map((concept, index) => (
        <Badge key={`v-${index}`} variant="primary">
          {String(concept.concept ?? '')}
          {typeof concept.score === 'number' ? ` · ${concept.score.toFixed(2)}` : ''}
        </Badge>
      ))}
    </Flex>
  );
};

/** A job's `outputs` object, which the API types only as an open record. */
type RobotsOutputPayload = Record<string, unknown>;

/** One shaped view: whether it has anything to draw, and what it draws. */
interface OutputView {
  hasContent: (outputs: RobotsOutputPayload) => boolean;
  render: (outputs: RobotsOutputPayload) => ReactElement;
}

/**
 * What Mux reports about a best-effort write to the asset, under `asset_updates` (v0's chapters
 * write was `asset_update`). Absent when the job was not asked to write, or ran before Mux
 * recorded outcomes; a job can complete with the write `failed`.
 */
type AssetUpdateKind = 'title' | 'chapters' | 'thumbnail';
type AssetUpdateOutcome = { variant: 'positive' | 'warning' | 'neutral'; text: string };

const ASSET_UPDATE_OUTCOMES: Record<AssetUpdateKind, Record<string, AssetUpdateOutcome>> = {
  title: {
    updated: { variant: 'positive', text: 'The generated title is now the Mux asset’s title.' },
    failed: { variant: 'warning', text: 'Mux could not set the generated title on the asset.' },
  },
  chapters: {
    created: {
      variant: 'positive',
      text: 'The chapters were added to the Mux video as its chapters track.',
    },
    failed: {
      variant: 'warning',
      text: 'Mux could not add these chapters to the video. They are still listed below.',
    },
  },
  thumbnail: {
    updated: { variant: 'positive', text: 'The best thumbnail is now the Mux video’s thumbnail.' },
    failed: { variant: 'warning', text: 'Mux could not set the video’s thumbnail.' },
  },
};

function assetUpdateOutcome(
  outputs: RobotsOutputPayload,
  kind: AssetUpdateKind
): AssetUpdateOutcome | undefined {
  const update =
    (outputs.asset_updates as Record<string, unknown> | undefined)?.[kind] ??
    (kind === 'chapters' ? outputs.asset_update : undefined);
  const status = (update as { status?: unknown } | undefined)?.status;
  return typeof status === 'string' &&
    Object.prototype.hasOwnProperty.call(ASSET_UPDATE_OUTCOMES[kind], status)
    ? ASSET_UPDATE_OUTCOMES[kind][status]
    : undefined;
}

const OutcomeNote: FC<{ outcome?: AssetUpdateOutcome }> = ({ outcome }) =>
  outcome ? (
    <Box marginBottom="spacingM">
      <Note variant={outcome.variant}>{outcome.text}</Note>
    </Box>
  ) : null;

/** Summarize's title, description and tags, which Analyze Structure also returns. */
const SummaryFields: FC<{
  title: unknown;
  description: unknown;
  descriptionLabel: string;
  tags: unknown;
}> = ({ title, description, descriptionLabel, tags }) => {
  const tagList = asStrings(tags);
  return (
    <>
      {typeof title === 'string' && (
        <Labelled label="Title">
          <Paragraph marginBottom="none">{title}</Paragraph>
        </Labelled>
      )}
      {typeof description === 'string' && (
        <Labelled label={descriptionLabel}>
          <Paragraph marginBottom="none">{description}</Paragraph>
        </Labelled>
      )}
      {tagList.length > 0 && (
        <Labelled label="Tags">
          <Flex gap="spacingXs" flexWrap="wrap" marginTop="spacingXs">
            {tagList.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </Flex>
        </Labelled>
      )}
    </>
  );
};

const SUMMARIZE: OutputView = {
  hasContent: (outputs) =>
    typeof outputs.title === 'string' ||
    typeof outputs.description === 'string' ||
    asStrings(outputs.tags).length > 0,
  render: (outputs) => (
    <>
      <OutcomeNote outcome={assetUpdateOutcome(outputs, 'title')} />
      <SummaryFields
        title={outputs.title}
        description={outputs.description}
        descriptionLabel="Description"
        tags={outputs.tags}
      />
    </>
  ),
};

const MODERATE: OutputView = {
  hasContent: (outputs) =>
    Object.keys((outputs.max_scores ?? {}) as Record<string, number>).length > 0 ||
    typeof outputs.exceeds_threshold === 'boolean',
  render: (outputs) => {
    const maxScores = (outputs.max_scores ?? {}) as Record<string, number>;
    return (
      <>
        <Box marginBottom="spacingM">
          <Badge variant={outputs.exceeds_threshold ? 'negative' : 'positive'}>
            {outputs.exceeds_threshold ? 'Exceeds a threshold' : 'Within thresholds'}
          </Badge>
        </Box>
        <SimpleTable columns={['Category', 'Highest score']}>
          {Object.entries(maxScores).map(([category, score]) => (
            <Table.Row key={category}>
              <Table.Cell>{category}</Table.Cell>
              <Table.Cell>{formatScore(score)}</Table.Cell>
            </Table.Row>
          ))}
        </SimpleTable>
      </>
    );
  },
};

const ASK_QUESTIONS: OutputView = {
  hasContent: (outputs) => asRows(outputs.answers).length > 0,
  render: (outputs) => (
    <SimpleTable columns={['Question', 'Answer', 'Confidence', 'Reasoning']}>
      {asRows(outputs.answers).map((answer, index) => (
        <Table.Row key={index}>
          <Table.Cell>{formatText(answer.question)}</Table.Cell>
          <Table.Cell>
            {answer.skipped ? (
              <Badge variant="secondary">Skipped</Badge>
            ) : (
              formatText(answer.answer)
            )}
          </Table.Cell>
          <Table.Cell>{formatScore(answer.confidence)}</Table.Cell>
          <Table.Cell>{String(answer.reasoning ?? '')}</Table.Cell>
        </Table.Row>
      ))}
    </SimpleTable>
  ),
};

const ChaptersTable: FC<{ chapters: Array<Record<string, unknown>> }> = ({ chapters }) => (
  <SimpleTable columns={['Start', 'Title']}>
    {chapters.map((chapter, index) => (
      <Table.Row key={index}>
        <Table.Cell>{formatSeconds(chapter.start_time as number)}</Table.Cell>
        <Table.Cell>{formatText(chapter.title)}</Table.Cell>
      </Table.Row>
    ))}
  </SimpleTable>
);

/** On by default here, so its absence is worth saying. */
const CHAPTERS_NOT_ADDED: AssetUpdateOutcome = {
  variant: 'neutral',
  text: 'These chapters were not added to the Mux video; they are listed below.',
};

const GENERATE_CHAPTERS: OutputView = {
  hasContent: (outputs) => asRows(outputs.chapters).length > 0,
  render: (outputs) => (
    <>
      <OutcomeNote outcome={assetUpdateOutcome(outputs, 'chapters') ?? CHAPTERS_NOT_ADDED} />
      <ChaptersTable chapters={asRows(outputs.chapters)} />
    </>
  ),
};

/** Find Key Moments' `moments` and Analyze Structure's `key_moments` are the same objects. */
const KeyMomentsTable: FC<{ moments: Array<Record<string, unknown>> }> = ({ moments }) => (
  <SimpleTable columns={['Range', 'Title', 'Score', 'Narrative', 'Concepts']}>
    {moments.map((moment, index) => {
      const quotable = moment.quotable_segment as { text?: unknown } | undefined;
      return (
        <Table.Row key={index}>
          <Table.Cell>{formatOutputRange(moment)}</Table.Cell>
          <Table.Cell>{formatText(moment.title)}</Table.Cell>
          <Table.Cell>{formatScore(moment.overall_score)}</Table.Cell>
          <Table.Cell>
            <NarrativeCell
              audible={moment.audible_narrative}
              visual={moment.visual_narrative}
              quotable={typeof quotable?.text === 'string' ? quotable.text : undefined}
            />
          </Table.Cell>
          <Table.Cell>
            <ConceptBadges
              audible={moment.notable_audible_concepts}
              visual={moment.notable_visual_concepts}
            />
          </Table.Cell>
        </Table.Row>
      );
    })}
  </SimpleTable>
);

const FIND_KEY_MOMENTS: OutputView = {
  hasContent: (outputs) => asRows(outputs.moments).length > 0,
  render: (outputs) => <KeyMomentsTable moments={asRows(outputs.moments)} />,
};

/** v0's Find Scenes and v1's Analyze Structure describe a scene the same way, in their own unit. */
const ScenesTable: FC<{ scenes: Array<Record<string, unknown>> }> = ({ scenes }) => (
  <SimpleTable columns={['Range', 'Title', 'Summary']}>
    {scenes.map((scene, index) => (
      <Table.Row key={index}>
        <Table.Cell>{formatOutputRange(scene)}</Table.Cell>
        <Table.Cell>{formatText(scene.title)}</Table.Cell>
        <Table.Cell>
          {String(
            scene.blended_narrative ?? scene.audible_narrative ?? scene.visual_narrative ?? ''
          )}
        </Table.Cell>
      </Table.Row>
    ))}
  </SimpleTable>
);

const FIND_SCENES: OutputView = {
  hasContent: (outputs) => asRows(outputs.scenes).length > 0,
  render: (outputs) => <ScenesTable scenes={asRows(outputs.scenes)} />,
};

/** One of Analyze Structure's lists, which Mux always sends and leaves empty when none qualify. */
const ListSection: FC<{ label: string; rows: unknown; empty: string; children: ReactElement }> = ({
  label,
  rows,
  empty,
  children,
}) => (
  <Labelled label={label}>
    <Box marginTop="spacingXs">
      {asRows(rows).length > 0 ? children : <Paragraph marginBottom="none">{empty}</Paragraph>}
    </Box>
  </Labelled>
);

const ANALYZE_STRUCTURE: OutputView = {
  hasContent: (outputs) =>
    typeof outputs.title === 'string' ||
    typeof outputs.summary === 'string' ||
    [outputs.chapters, outputs.scenes, outputs.key_moments].some(Array.isArray),
  render: (outputs) => (
    <>
      <OutcomeNote outcome={assetUpdateOutcome(outputs, 'title')} />
      <OutcomeNote outcome={assetUpdateOutcome(outputs, 'chapters')} />
      <SummaryFields
        title={outputs.title}
        description={outputs.summary}
        descriptionLabel="Summary"
        tags={outputs.tags}
      />
      <ListSection label="Chapters" rows={outputs.chapters} empty="Mux found no chapters.">
        <ChaptersTable chapters={asRows(outputs.chapters)} />
      </ListSection>
      <ListSection
        label="Scenes"
        rows={outputs.scenes}
        empty="Mux found no scenes. An audio-only video has none.">
        <ScenesTable scenes={asRows(outputs.scenes)} />
      </ListSection>
      <ListSection label="Key moments" rows={outputs.key_moments} empty="Mux found no key moments.">
        <KeyMomentsTable moments={asRows(outputs.key_moments)} />
      </ListSection>
    </>
  ),
};

const FIND_BEST_THUMBNAILS: OutputView = {
  hasContent: (outputs) => asRows(outputs.best_thumbnails).length > 0,
  render: (outputs) => (
    <>
      <OutcomeNote outcome={assetUpdateOutcome(outputs, 'thumbnail')} />
      <SimpleTable columns={['Timestamp', 'Score', 'Description']}>
        {asRows(outputs.best_thumbnails).map((thumbnail, index) => (
          <Table.Row key={index}>
            <Table.Cell>
              {formatSeconds(outputSeconds(thumbnail, 'time', 'timestamp_ms'))}
            </Table.Cell>
            <Table.Cell>{formatScore(thumbnail.overall)}</Table.Cell>
            <Table.Cell>{String(thumbnail.description ?? '')}</Table.Cell>
          </Table.Row>
        ))}
      </SimpleTable>
    </>
  ),
};

const ENGAGEMENT_INSIGHTS: OutputView = {
  hasContent: (outputs) => {
    const overall = (outputs.overall_insight ?? {}) as Record<string, unknown>;
    return (
      typeof overall.summary === 'string' ||
      asStrings(overall.trends).length > 0 ||
      asRows(outputs.moment_insights).length > 0
    );
  },
  render: (outputs) => {
    const overall = (outputs.overall_insight ?? {}) as Record<string, unknown>;
    const trends = asStrings(overall.trends);
    const moments = asRows(outputs.moment_insights);
    return (
      <>
        {typeof overall.summary === 'string' && <Paragraph>{overall.summary}</Paragraph>}
        {trends.length > 0 && (
          <List>
            {trends.map((trend) => (
              <List.Item key={trend}>{trend}</List.Item>
            ))}
          </List>
        )}
        {moments.length > 0 && (
          <RobotsJsonBlock
            value={moments}
            what="these moment insights"
            testId="robots-output-json"
          />
        )}
      </>
    );
  },
};

/**
 * What these four produce is a track on the Mux asset, not a document. The note is the result; the
 * payload beside it is the track ids, which is what someone chasing a missing track needs.
 */
const TRACK_PRODUCING: OutputView = {
  hasContent: () => true,
  render: (outputs) => (
    <>
      <Note variant="positive">
        The generated track is on the Mux video. Resync the asset if it has not shown up in the
        Captions or Audio Tracks tab yet.
      </Note>
      <RobotsJsonBlock value={outputs} what="this output" testId="robots-output-json" />
    </>
  ),
};

export const OUTPUT_VIEWS: Partial<Record<RobotsWorkflow, OutputView>> = {
  summarize: SUMMARIZE,
  moderate: MODERATE,
  'ask-questions': ASK_QUESTIONS,
  'generate-chapters': GENERATE_CHAPTERS,
  'find-key-moments': FIND_KEY_MOMENTS,
  'analyze-structure': ANALYZE_STRUCTURE,
  'find-scenes': FIND_SCENES,
  'find-best-thumbnails': FIND_BEST_THUMBNAILS,
  'generate-engagement-insights': ENGAGEMENT_INSIGHTS,
  'generate-premium-captions': TRACK_PRODUCING,
  'edit-captions': TRACK_PRODUCING,
  'translate-captions': TRACK_PRODUCING,
  'translate-audio': TRACK_PRODUCING,
};

/**
 * What the entry keeps of a job Mux deleted: the stored outputs. Analyze Structure keeps only its
 * title, summary and tags, so its view leaves out the lists it would otherwise call empty.
 */
export const KEPT_OUTPUT_VIEWS: Partial<Record<RobotsWorkflow, OutputView>> = {
  summarize: SUMMARIZE,
  moderate: MODERATE,
  'analyze-structure': {
    hasContent: ANALYZE_STRUCTURE.hasContent,
    render: (outputs) => (
      <SummaryFields
        title={outputs.title}
        description={outputs.summary}
        descriptionLabel="Summary"
        tags={outputs.tags}
      />
    ),
  },
};
