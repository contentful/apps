import DisclaimerSection from './DisclaimerSection';
import { render, screen } from '@testing-library/react';
import configPageCopies from 'constants/configPageCopies';

const { getByText } = screen;
const { sectionTitle, linkSubstring } = configPageCopies.disclaimerSection;

describe('DisclaimerSection component', () => {
  it('Component mounts without correct content', async () => {
    render(<DisclaimerSection />);

    const title = getByText(sectionTitle);
    const hyperLink = getByText(linkSubstring);

    expect(title).toBeVisible();
    expect(hyperLink).toBeVisible();
  });

});
