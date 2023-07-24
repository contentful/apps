import { render, screen } from '@testing-library/react';
import DisclaimerMessage, { BODY_MSG } from './DisclaimerMessage';

const { getByText } = screen;

describe('DisclaimerMessage component', () => {
  it('mounts', async () => {
    render(<DisclaimerMessage />);

    const message = getByText(BODY_MSG);

    expect(message).toBeTruthy();
  });
});
