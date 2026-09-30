import type { UserAPI } from '@contentful/app-sdk';
import type { InstallationParams } from './types';

/**
 * Who sees the controls that run Robots: space admins always, everyone else once an admin turns
 * on "Let everyone run Robots" in the app configuration.
 *
 * "Run" is every control that spends units or stops a job — starting a workflow or a directive,
 * cancelling, and choosing directives on upload. Results and Apply to entry stay open to everyone,
 * because reading costs nothing.
 *
 * A UI guardrail, not a permission: `muxProxy` forwards any Robots call, whoever makes it, and the
 * Mux secret reaches the browser, so nothing refuses the call itself. See ADR-0016.
 */

export const ROBOTS_ALLOW_EVERYONE_LABEL = 'Let everyone run Robots';

export const ROBOTS_ALLOW_EVERYONE_HELP_TEXT =
  'When this is off, only space admins see the controls to run workflows and directives. ' +
  'Everyone can still see results.';

/** The Robots tab, in place of the run controls. */
export const ROBOTS_ADMINS_ONLY_NOTE =
  'Only space admins can run Robots here. Ask an admin to run one for you, or to turn on ' +
  `“${ROBOTS_ALLOW_EVERYONE_LABEL}” in the app configuration.`;

/** The upload dialog, above the directives that run whether or not this person could choose. */
export const ROBOTS_DIRECTIVES_SET_BY_ADMIN =
  'These directives run on every upload. An admin sets them in the app configuration.';

/**
 * The membership flag, never a role name: an admin's `roles` is empty, and roles can be renamed.
 * A location that hands over no user reads as not an admin, so a gap never widens access.
 */
export function isSpaceAdmin(user: Pick<UserAPI, 'spaceMembership'> | undefined): boolean {
  return user?.spaceMembership?.admin === true;
}

/** The whole rule. `=== true` is the default: a switch nobody has saved means admins only. */
export function canRunRobots(
  isAdmin: boolean,
  params: Pick<InstallationParams, 'muxRobotsAllowEveryone'>
): boolean {
  return isAdmin || params.muxRobotsAllowEveryone === true;
}
