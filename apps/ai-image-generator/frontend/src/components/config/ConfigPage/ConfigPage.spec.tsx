import ConfigPage from './ConfigPage';
import { render, screen } from '@testing-library/react';
import configPageCopies from 'constants/configPageCopies';

const { getByText, getByTestId } = screen;
const { pageTitle } = configPageCopies.configPage;

describe('ConfigPage component', () => {
  it('Component mounts', async () => {
    render(<ConfigPage handleConfig={() => null} parameters={{}} />);

    const title = getByText(pageTitle);
    const apiKeySection = getByTestId('api-key-section');

    expect(title).toBeVisible();
    expect(apiKeySection).toBeVisible();
  });
});
