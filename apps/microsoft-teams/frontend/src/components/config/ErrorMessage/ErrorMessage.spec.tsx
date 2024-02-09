import ErrorMessage from './ErrorMessage';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { channelSelection } from '@constants/configCopy';

const { getByText } = screen;

describe('ErrorMessage component', () => {
  it('mounts and renders the correct content', () => {
    const { errorMessage } = channelSelection.modal;
    render(<ErrorMessage errorMessage={errorMessage} />);

    const message = getByText(errorMessage);

    expect(message).toBeTruthy();
  });
});
