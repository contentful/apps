import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Model from './Model';

describe('Display Model', () => {
  it('renders all featured models', async () => {
    const { getByText, unmount } = render(
      <Model model={''} modelValid={false} dispatch={() => ''} />
    );
    await waitFor(() => {
      expect(getByText('Anthropic Claude Sonnet 4.6')).toBeTruthy();
    });
    expect(getByText('Anthropic Claude v2.1')).toBeTruthy();
    expect(getByText('Anthropic Claude Instant v1.2')).toBeTruthy();
    expect(getByText('Meta Llama 2 70B')).toBeTruthy();
    unmount();
  });
});
