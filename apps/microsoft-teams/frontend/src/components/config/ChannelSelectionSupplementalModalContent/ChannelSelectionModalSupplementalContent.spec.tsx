import ChannelSelectionSupplementalModalContent from './ChannelSelectionSupplementalModalContent';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { mockChannels } from '@test/mocks';

const { getByText } = screen;

describe('ChannelSelectionSupplementalModalContent component', () => {
  it('mounts and renders the correct content', () => {
    const childrenContent = 'test child';
    render(
      <ChannelSelectionSupplementalModalContent
        onClose={() => null}
        handleNotificationEdit={() => null}
        selectedChannel={mockChannels[0]}>
        <div>{childrenContent}</div>
      </ChannelSelectionSupplementalModalContent>
    );

    const message = getByText(childrenContent);

    expect(message).toBeTruthy();
  });
});
