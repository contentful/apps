import { describe, expect, it } from 'vitest';
import DisclaimerSection from './DisclaimerSection';
import { render, screen } from '@testing-library/react';
import { Sections } from '../configText';

const { getByText } = screen;
const { disclaimerHeading, disclaimerLinkSubstring } = Sections;

describe('DisclaimerSection component', () => {
  it('Component mounts without correct content', async () => {
    render(<DisclaimerSection />);

    const title = getByText(disclaimerHeading);
    const hyperLink = getByText(disclaimerLinkSubstring);

    expect(title).toBeTruthy();
    expect(hyperLink).toBeTruthy();
  });
});
