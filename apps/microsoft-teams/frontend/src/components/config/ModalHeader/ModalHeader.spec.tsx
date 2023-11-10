import ModalHeader from './ModalHeader';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { channelSelection } from '@constants/configCopy';

describe('ModalHeader component', () => {
  it('mounts and renders the correct title', () => {
    render(<ModalHeader title={channelSelection.modal.title} onClose={vi.fn()} />);

    expect(screen.getByText(channelSelection.modal.title)).toBeTruthy();
  });
});
