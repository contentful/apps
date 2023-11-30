import EmptyState from './EmptyState';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { channelSelection } from '@constants/configCopy';

describe('EmptyState component', () => {
  it('mounts and renders the correct content', () => {
    render(
      <EmptyState
        image={<></>}
        heading={channelSelection.modal.emptyHeading}
        body={channelSelection.modal.emptyContent}
        linkSubstring=""
        linkHref=""
      />
    );

    expect(screen.getByText(channelSelection.modal.emptyHeading)).toBeTruthy();
    expect(screen.getByText(channelSelection.modal.emptyContent)).toBeTruthy();
  });
});
