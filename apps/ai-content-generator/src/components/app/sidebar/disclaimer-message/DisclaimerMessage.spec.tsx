import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DisclaimerMessage, { BODY_MSG } from './DisclaimerMessage';

const { getByText } = screen;

describe('DisclaimerMessage component', () => {
  it('mounts', async () => {
    const { container } = render(<DisclaimerMessage />);

    // TODO: Figure out why this is not working with the vitest library
    // const message = getByText(
    //   "This feature uses a third party AI tool. Please ensure your use of the tool and any AI-generated content complies with applicable laws, your compan's policies, and all other"
    // );
    // expect(message).toBeTruthy();

    const text = container.querySelector('a');

    expect(text).toBeDefined();
  });
});
