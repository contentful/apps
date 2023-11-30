import AccessSection from './AccessSection';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { accessSection } from '@constants/configCopy';

const tenantIdValue = 'abc-123';

describe('AccessSection component', () => {
  it('mounts with tenantId provided', () => {
    const { unmount } = render(<AccessSection dispatch={vi.fn()} tenantId={tenantIdValue} />);

    expect(screen.getByDisplayValue(tenantIdValue)).toBeTruthy();
    unmount();
  });
  it('displays correct copy', () => {
    const { unmount } = render(<AccessSection dispatch={vi.fn()} tenantId={''} />);

    expect(screen.getByText(accessSection.title)).toBeTruthy();
    expect(screen.getByText(accessSection.fieldName)).toBeTruthy();
    unmount();
  });
});
