import { render, screen } from '@testing-library/react';
import GettingStartedSection from './GettingStartedSection';
import configPageCopies from 'constants/configPageCopies';
import { mockSdk } from '../../../../test/mocks';

const { getByText } = screen;
const { sectionTitle } = configPageCopies.gettingStartedSection;

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('GettingStartedSection component', () => {
  it('Component mounts without correct content', async () => {
    render(<GettingStartedSection sdk={mockSdk} />);

    const title = getByText(sectionTitle);

    expect(title).toBeVisible();
  });
});
