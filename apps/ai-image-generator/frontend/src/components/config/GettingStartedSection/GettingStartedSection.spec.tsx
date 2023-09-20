import { render, screen } from '@testing-library/react';
import GettingStartedSection from './GettingStartedSection';
import configPageCopies from 'constants/configPageCopies';
import { SDKProvider } from '@contentful/react-apps-toolkit';

const { getByText } = screen;
const { sectionTitle } = configPageCopies.gettingStartedSection;

describe('GettingStartedSection component', () => {
  it('Component mounts without correct content', async () => {
    render(
      <SDKProvider>
        <GettingStartedSection />
      </SDKProvider>
    );

    const title = getByText(sectionTitle);

    expect(title).toBeVisible();
  });
});
