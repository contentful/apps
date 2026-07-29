import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import { CLASSIC_ENTITIES, EXO_ENTITIES } from '../components/types/config';
import { isActionAvailable } from '../utils/permissions';

describe('usePermissions', () => {
  describe('handleColumnToggle scoped to a section', () => {
    it('no dead-click: toggles the section read column off on the first click even when the other section is all false', () => {
      const { result } = renderHook(() => usePermissions());

      // Turn the classic section's read ON (first toggle: all false → true).
      act(() => {
        result.current.handleColumnToggle(CLASSIC_ENTITIES, 'read');
      });

      const classicReadEntities = CLASSIC_ENTITIES.filter((e) => isActionAvailable(e, 'read'));

      // All classic entities should now have read = true.
      for (const entity of classicReadEntities) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(true);
      }

      // ExO buckets should remain false (a different section, never touched).
      for (const entity of EXO_ENTITIES) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(false);
      }

      // Toggle off — must clear on the FIRST click (no dead-click regression).
      act(() => {
        result.current.handleColumnToggle(CLASSIC_ENTITIES, 'read');
      });

      // All classic entities' read must now be false.
      for (const entity of classicReadEntities) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(false);
      }
    });

    it('does not write into the other section when toggling a column on', () => {
      const { result } = renderHook(() => usePermissions());

      act(() => {
        result.current.handleColumnToggle(CLASSIC_ENTITIES, 'read');
      });

      // ExO entities must stay at their default (all false).
      for (const entity of EXO_ENTITIES) {
        const perms = result.current.contentLifecyclePermissions[entity];
        expect(perms.read).toBe(false);
        expect(perms.edit).toBe(false);
        expect(perms.create).toBe(false);
      }
    });

    it('toggles the ExO section independently of the classic section', () => {
      const { result } = renderHook(() => usePermissions());

      act(() => {
        result.current.handleColumnToggle(EXO_ENTITIES, 'read');
      });

      // ExO entities that support read should now be true.
      for (const entity of EXO_ENTITIES.filter((e) => isActionAvailable(e, 'read'))) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(true);
      }

      // Classic entities must remain false.
      for (const entity of CLASSIC_ENTITIES) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(false);
      }
    });
  });

  describe('handleSelectAllToggle scoped to a section', () => {
    it('enables only the given section and leaves the other section untouched', () => {
      const { result } = renderHook(() => usePermissions());

      act(() => {
        result.current.handleSelectAllToggle(CLASSIC_ENTITIES);
      });

      // Classic entities should be fully enabled.
      for (const entity of CLASSIC_ENTITIES) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(true);
      }

      // ExO entities must remain at defaults (all false).
      for (const entity of EXO_ENTITIES) {
        const perms = result.current.contentLifecyclePermissions[entity];
        expect(perms.read).toBe(false);
        expect(perms.edit).toBe(false);
        expect(perms.create).toBe(false);
      }
    });

    it('toggles the section off on a second call', () => {
      const { result } = renderHook(() => usePermissions());

      act(() => {
        result.current.handleSelectAllToggle(EXO_ENTITIES);
      });
      for (const entity of EXO_ENTITIES.filter((e) => isActionAvailable(e, 'read'))) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(true);
      }

      act(() => {
        result.current.handleSelectAllToggle(EXO_ENTITIES);
      });
      for (const entity of EXO_ENTITIES) {
        expect(result.current.contentLifecyclePermissions[entity].read).toBe(false);
      }
    });
  });
});
