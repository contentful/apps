import { describe, expect, it } from 'vitest';
import { canRunRobots, isSpaceAdmin } from './robotsAccess';

describe('canRunRobots', () => {
  it.each([
    // An install that never saved the switch is admins only: Robots is billable, and nobody had
    // access to lose when this shipped.
    { isAdmin: true, allowEveryone: undefined, expected: true },
    { isAdmin: true, allowEveryone: false, expected: true },
    { isAdmin: true, allowEveryone: true, expected: true },
    { isAdmin: false, allowEveryone: undefined, expected: false },
    { isAdmin: false, allowEveryone: false, expected: false },
    { isAdmin: false, allowEveryone: true, expected: true },
  ])(
    'admin: $isAdmin, switch: $allowEveryone → $expected',
    ({ isAdmin, allowEveryone, expected }) => {
      expect(canRunRobots(isAdmin, { muxRobotsAllowEveryone: allowEveryone })).toBe(expected);
    }
  );
});

describe('isSpaceAdmin', () => {
  const user = (admin: boolean, roles: string[] = []) => ({
    spaceMembership: {
      sys: { id: 'membership-1', type: 'SpaceMembership' },
      admin,
      roles: roles.map((name) => ({ name, description: '' })),
    },
  });

  it('reads the membership flag, which is set on an admin whose roles are empty', () => {
    expect(isSpaceAdmin(user(true))).toBe(true);
  });

  it('never matches a role name, however it is spelled', () => {
    expect(isSpaceAdmin(user(false, ['Admin', 'Administrator']))).toBe(false);
  });

  it('reads a missing user as not an admin', () => {
    expect(isSpaceAdmin(undefined)).toBe(false);
  });
});
