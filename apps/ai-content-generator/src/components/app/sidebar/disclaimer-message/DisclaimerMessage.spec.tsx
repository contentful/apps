import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DisclaimerMessage, { BODY_MSG } from './DisclaimerMessage';

describe('DisclaimerMessage component', () => {
  it('mounts', async () => {
    const { getByText } = render(<DisclaimerMessage />);
    const message = 'Terms and Policies';

    expect(getByText(message)).toBeTruthy();
  });
});
