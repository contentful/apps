import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import { ALL_ENTITIES, EXO_ENTITIES } from '../components/types/config';
import { isActionAvailable } from '../utils/permissions';

/** Classic-space visible entities: all entities except ExO-only ones. */
const CLASSIC_ENTITIES = ALL_ENTITIES.filter((e) => !EXO_ENTITIES.includes(e));

describe('usePermissions', () => {
  describe('handleColumnToggle with scoped visibleEntities', () => {
    it('no dead-click: toggles visible read column off on the first click even when hidden ExO buckets are false', () => {
      const { result } = renderHook(() => usePermissions(CLASSIC_ENTITIES));

      // Turn all visible entities' read ON (first toggle: all false → true).
      act(() => {
        result.current.handleColumnToggle('read');
      });

      const classicReadEntities = CLASSIC_ENTITIES.filter((e) => isActionAvailable(e, 'read'));

      // All classic (visible) entities should now have read = true.
      for (const entity of classicReadEntities) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(true);
      }

      // ExO buckets should remain false (never touched).
      for (const entity of EXO_ENTITIES) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(false);
      }

      // Toggle off — must clear on the FIRST click (no dead-click regression).
      act(() => {
        result.current.handleColumnToggle('read');
      });

      // All classic (visible) entities' read must now be false.
      for (const entity of classicReadEntities) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(false);
      }

      // ExO buckets must still be false.
      for (const entity of EXO_ENTITIES) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(false);
      }
    });

    it('does not write into hidden ExO buckets when toggling a column on', () => {
      const { result } = renderHook(() => usePermissions(CLASSIC_ENTITIES));

      act(() => {
        result.current.handleColumnToggle('read');
      });

      // Hidden ExO entities must stay at their default (all false).
      for (const entity of EXO_ENTITIES) {
        const perms = result.current.contentLifecyclePermissions[entity];
        expect(perms.read).toBe(false);
        expect(perms.edit).toBe(false);
        expect(perms.create).toBe(false);
      }
    });
  });

  describe('handleSelectAllToggle with scoped visibleEntities', () => {
    it('does not write into hidden ExO buckets when selecting all', () => {
      const { result } = renderHook(() => usePermissions(CLASSIC_ENTITIES));

      act(() => {
        result.current.handleSelectAllToggle();
      });

      // Classic entities should be fully enabled.
      for (const entity of CLASSIC_ENTITIES) {
        const perms = result.current.contentLifecyclePermissions[entity];
        expect(perms.read).toBe(true);
      }

      // ExO entities must remain at defaults (all false).
      for (const entity of EXO_ENTITIES) {
        const perms = result.current.contentLifecyclePermissions[entity];
        expect(perms.read).toBe(false);
        expect(perms.edit).toBe(false);
        expect(perms.create).toBe(false);
      }
    });
  });
});
