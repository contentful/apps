import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GettingStartedSection } from './GettingStartedSection';
import { copies } from '@constants/copies';

const { contentPreviewSidebar, contentPreviewSettings, title } =
  copies.configPage.gettingStartedSection;

describe('GettingStartedSection', () => {
  it('renders content', () => {
    render(<GettingStartedSection />);
    const titleText = screen.getByText(title);
    const stepOneText = screen.getByText(contentPreviewSidebar.copy);
    const stepTwoText = screen.getByText(contentPreviewSettings.copy);

    expect(titleText).toBeTruthy();
    expect(stepOneText).toBeTruthy();
    expect(stepTwoText).toBeTruthy();
  });
});
