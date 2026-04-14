import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { SelectionActionMenu } from '../../../../../src/locations/Page/components/review/SelectionActionMenu';

describe('SelectionActionMenu', () => {
  const anchorRect = { top: 100, left: 40, bottom: 120, right: 200 };

  beforeEach(() => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(800);
  });

  it('renders Assign and Exclude and invokes callbacks', () => {
    const onAssign = vi.fn();
    const onExclude = vi.fn();

    render(
      <SelectionActionMenu anchorRect={anchorRect} onAssign={onAssign} onExclude={onExclude} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Assign' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exclude' }));

    expect(onAssign).toHaveBeenCalledTimes(1);
    expect(onExclude).toHaveBeenCalledTimes(1);
  });
});
