import AccessSection from './AccessSection';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const tenantIdValue = 'abc-123';

describe('AccessSection component', () => {
  it('mounts with tenantId provided', () => {
    render(<AccessSection dispatch={vi.fn()} tenantId={tenantIdValue} />);

    expect(screen.getByDisplayValue(tenantIdValue)).toBeTruthy();
  });
});
