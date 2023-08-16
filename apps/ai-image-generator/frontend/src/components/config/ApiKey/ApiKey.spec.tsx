import APIKey, { SUBSTRING, TITLE } from './APIKey';
import { render, screen } from '@testing-library/react';

const { getByText, getByTestId } = screen;

describe('APIKey component', () => {
  it('Component mounts without apiKey provided', async () => {
    render(<APIKey handleApiKey={() => null} />);

    const title = getByText(TITLE);
    const input = getByTestId('cf-ui-text-input');
    const hyperLink = getByText(SUBSTRING);

    expect(title).toBeVisible();
    expect(input).toBeVisible();
    expect(hyperLink).toBeVisible();
  });

  it('Component mounts with apiKey provided', async () => {
    const API_KEY = 'ksdfusdfkjh';
    render(<APIKey handleApiKey={() => null} apiKey='ksdfusdfkjh' />);

    const input = getByTestId('cf-ui-text-input');

    expect(input).toHaveValue('*******fkjh');
  });
});
