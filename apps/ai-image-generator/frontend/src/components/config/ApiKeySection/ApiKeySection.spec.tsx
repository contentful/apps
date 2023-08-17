import APIKey from './APIKeySection';
import { render, screen } from '@testing-library/react';
import configPageCopies from 'constants/configPageCopies';

const { getByText, getByTestId } = screen;
const { sectionTitle, linkSubstring } = configPageCopies.apiKeySection;

describe('APIKeySection component', () => {
  it('Component mounts without apiKey provided', async () => {
    render(<APIKey handleApiKey={() => null} />);

    const title = getByText(sectionTitle);
    const input = getByTestId('cf-ui-text-input');
    const hyperLink = getByText(linkSubstring);

    expect(title).toBeVisible();
    expect(input).toBeVisible();
    expect(hyperLink).toBeVisible();
  });

  it('Component mounts with apiKey provided', async () => {
    render(<APIKey handleApiKey={() => null} apiKey='ksdfusdfkjh' />);

    const input = getByTestId('cf-ui-text-input');

    expect(input).toHaveValue('*******fkjh');
  });
});
