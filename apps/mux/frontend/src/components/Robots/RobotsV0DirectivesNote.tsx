import { FC } from 'react';
import { Note } from '@contentful/f36-components';
import ExternalLink from '../ExternalLink';
import { ROBOTS_DIRECTIVES_MIGRATION_URL } from '../../util/robots';
import { RobotsDirective } from '../../util/robotsTypes';

/**
 * Directives created on Robots v0 stay on v0 wherever their id is used, uploads included, until the
 * account owner replaces them with a v1 copy made in Mux. This app runs them on v0 meanwhile, so
 * the note asks for the migration rather than blocking anything. See ADR-0017.
 */
interface RobotsV0DirectivesNoteProps {
  directives: RobotsDirective[];
  /** What to do once the copy exists, which depends on the screen. */
  nextStep: string;
}

const RobotsV0DirectivesNote: FC<RobotsV0DirectivesNoteProps> = ({ directives, nextStep }) => {
  if (directives.length === 0) return null;
  const names = directives.map((directive) => `“${directive.name || directive.id}”`).join(', ');

  return (
    <Note
      variant="warning"
      title="Some directives still run on Robots v0"
      data-testid="robots-v0-directives">
      {names} {directives.length === 1 ? 'runs' : 'run'} on Robots v0, which Mux is retiring. Create
      a v1 copy of {directives.length === 1 ? 'it' : 'each'} in the Mux dashboard, then {nextStep}{' '}
      <ExternalLink href={ROBOTS_DIRECTIVES_MIGRATION_URL}>How to migrate directives</ExternalLink>
    </Note>
  );
};

export default RobotsV0DirectivesNote;
