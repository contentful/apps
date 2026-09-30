import { FC, ReactNode } from 'react';
import { Box, Note, Paragraph } from '@contentful/f36-components';
import { RobotsAdvisory, RobotsUnavailableState } from '../../util/robotsTypes';
import { ROBOTS_DASHBOARD_URL, ROBOTS_PRICING_URL, ROBOTS_TOKEN_DOCS_URL } from '../../util/robots';
import ExternalLink from '../ExternalLink';

/**
 * What the tab says when Robots cannot run, or cannot run everything.
 *
 * Two kinds, and the caller decides where each goes: an unavailable state replaces the tab,
 * because nothing in it could work; an advisory sits above a working one. Mux's own sentence is
 * not repeated under ours — each state already says what is wrong and what to do, and the one
 * thing Mux's message carries that ours cannot know, the terms page, arrives as `termsUrl`.
 */

type NoteState = RobotsUnavailableState | RobotsAdvisory;

interface RobotsCapabilityNoteProps {
  state: NoteState;
  /** The exact page Mux named for accepting the terms. Without one, the dashboard itself. */
  termsUrl?: string;
}

interface CapabilityCopy {
  variant: 'warning' | 'neutral';
  title: string;
  testId: string;
  body: (termsUrl: string) => ReactNode;
}

const COPY: Record<NoteState, CapabilityCopy> = {
  'scope-missing': {
    variant: 'warning',
    title: 'This Mux token cannot use Robots',
    testId: 'robots-scope-missing',
    body: () => (
      <>
        The <code>robots:*</code> scope cannot be added to a token that already exists, so this
        needs a new access token rather than a settings change. Generate one with the{' '}
        <code>robots:*</code> scope in{' '}
        <ExternalLink href={ROBOTS_TOKEN_DOCS_URL}>your Mux dashboard</ExternalLink> and paste it
        into this app&apos;s configuration.
      </>
    ),
  },
  'units-exhausted': {
    variant: 'warning',
    title: 'Not enough Mux AI units left this month',
    testId: 'robots-units-exhausted',
    body: () => (
      <>
        Mux refused the last run: every Mux account gets 100,000 AI units a month at no cost, and
        this one does not have enough left for it. A cheaper workflow may still fit. Units reset
        next month, or sooner on a paid plan —{' '}
        <ExternalLink href={ROBOTS_PRICING_URL}>see Robots pricing</ExternalLink>.
      </>
    ),
  },
  'not-enabled': {
    variant: 'neutral',
    title: 'Robots is not enabled for this Mux account',
    testId: 'robots-not-enabled',
    body: (termsUrl) => (
      <>
        Robots runs AI workflows — captions, dubs, summaries, chapters, moderation — against your
        Mux videos, and Mux turns it on once its terms are accepted.{' '}
        <ExternalLink href={termsUrl}>Accept the Robots terms in your Mux dashboard</ExternalLink>.
      </>
    ),
  },
};

const RobotsCapabilityNote: FC<RobotsCapabilityNoteProps> = ({ state, termsUrl }) => {
  const copy = COPY[state] ?? COPY['not-enabled'];

  return (
    <Box marginTop="spacingM" marginBottom="spacingM">
      <Note variant={copy.variant} title={copy.title} data-testid={copy.testId}>
        <Paragraph marginBottom="none">{copy.body(termsUrl ?? ROBOTS_DASHBOARD_URL)}</Paragraph>
      </Note>
    </Box>
  );
};

export default RobotsCapabilityNote;
