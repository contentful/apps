import ChannelsErrorMessage from './ChannelsErrorMessage';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { channelSelection } from '@constants/configCopy';

const { getByText } = screen;

describe('ChannelsErrorMessage component', () => {
  it('mounts and renders the correct content', () => {
    const { errorMessage } = channelSelection.modal;
    render(<ChannelsErrorMessage errorMessage={errorMessage} />);

    const message = getByText(errorMessage);

    expect(message).toBeTruthy();
  });
});
