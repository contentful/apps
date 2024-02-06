import ChannelsLoadingState from './ChannelsLoadingState';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

const { getByTestId } = screen;

describe('ChannelsLoadingState component', () => {
  it('mounts and renders the correct content', () => {
    render(<ChannelsLoadingState />);

    const loadingTable = getByTestId('channels-loading');

    expect(loadingTable).toBeTruthy();
  });
});
