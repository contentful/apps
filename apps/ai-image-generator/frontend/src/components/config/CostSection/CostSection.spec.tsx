import CostSection from './CostSection';
import { render, screen } from '@testing-library/react';
import configPageCopies from 'constants/configPageCopies';

const { getByText } = screen;
const { sectionTitle, pricingLinkSubstring, creditLinkSubstring } = configPageCopies.costSection;

describe('CostSection component', () => {
  it('Component mounts without correct content', async () => {
    render(<CostSection />);

    const title = getByText(sectionTitle);
    const pricingHyperlink = getByText(pricingLinkSubstring);
    const creditHyperlink = getByText(creditLinkSubstring);

    expect(title).toBeVisible();
    expect(pricingHyperlink).toBeVisible();
    expect(creditHyperlink).toBeVisible();
  });
});
