import ConfigPage, { PAGE_TITLE } from './ConfigPage';
import { render, screen } from '@testing-library/react';

const { getByText, getByTestId } = screen;

describe('ConfigPage component', () => {
  it('Component mounts', async () => {
    render(<ConfigPage handleConfig={() => null} parameters={{}} />);

    const title = getByText(PAGE_TITLE);
    const apiKeySection = getByTestId('api-key-section');

    expect(title).toBeVisible();
    expect(apiKeySection).toBeVisible();
  });
});
