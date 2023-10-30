import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ConnectToTeams from './ConnectToTeams';

describe('ConnectToTeams component', () => {
  it('Component mounts without correct content', async () => {
    const { getByText } = render(<ConnectToTeams />);

    expect(getByText('Configure your Teams account')).toBeTruthy();
    expect(getByText('Sign into Microsoft Teams in order to connect your account.')).toBeTruthy();
  });
});
