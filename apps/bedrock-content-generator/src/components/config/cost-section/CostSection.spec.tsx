import { describe, expect, it } from 'vitest';
import CostSection from './CostSection';
import { render, screen } from '@testing-library/react';
import { Sections } from '../configText';

const { getByText } = screen;
const { costHeading, costLinkSubstring, rateLimitLinkSubstring } = Sections;

describe('CostSection component', () => {
  it('Component mounts without correct content', async () => {
    render(<CostSection />);

    const title = getByText(costHeading);
    const pricingHyperlink = getByText(costLinkSubstring);
    const rateLimitHyperlink = getByText(rateLimitLinkSubstring);

    expect(title).toBeTruthy();
    expect(pricingHyperlink).toBeTruthy();
    expect(rateLimitHyperlink).toBeTruthy();
  });
});
