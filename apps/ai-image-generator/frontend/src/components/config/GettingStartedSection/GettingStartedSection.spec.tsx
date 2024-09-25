import { render, screen } from '@testing-library/react';
import GettingStartedSection from './GettingStartedSection';
import configPageCopies from '@constants/configPageCopies';
import { mockSdk } from '../../../../test/mocks';
import { vi } from 'vitest';

const { getByText } = screen;
const { sectionTitle } = configPageCopies.gettingStartedSection;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('GettingStartedSection component', () => {
  it('Component mounts without correct content', async () => {
    render(<GettingStartedSection />);

    const title = getByText(sectionTitle);

    expect(title).toBeVisible();
  });
});
