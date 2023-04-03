import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockSdk } from '../../../../test/mocks';
import NextStepSection, { formatMessage } from './NextStepsSection';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

const { getByText, getAllByTestId } = screen;

const testComponentRender = async (isContentTypeConfigured?: boolean) => {
  const descriptionCopy = formatMessage(isContentTypeConfigured).replace('Content tab', '').trim();

  const title = getByText('View app');
  const description = getByText(descriptionCopy);
  const hyperLinks = getAllByTestId('cf-ui-text-link');

  expect(title).toBeVisible();
  expect(description).toBeVisible();
  expect(hyperLinks).toHaveLength(2);
  hyperLinks.forEach((link) => expect(link).toBeVisible());
};

describe('NextStepSection', () => {
  it('mounts with correct copies when content type is configured', async () => {
    render(<NextStepSection isContentTypeConfigured />);

    await testComponentRender(true);
  });

  it('mounts with correct copies when content type is not configured', async () => {
    render(<NextStepSection />);

    await testComponentRender();
  });

  it('calls function to open entries list page when link is clicked', async () => {
    const mockOpenEntriesList = jest.fn();
    mockSdk.navigator.openEntriesList = mockOpenEntriesList;
    const user = userEvent.setup();
    render(<NextStepSection />);

    const linkToOpenEntriesTab = getByText('Content tab');
    await user.click(linkToOpenEntriesTab);

    expect(mockOpenEntriesList).toHaveBeenCalled();
  });
});
