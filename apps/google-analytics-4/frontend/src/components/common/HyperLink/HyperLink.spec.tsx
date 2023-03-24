import HyperLink from './HyperLink';
import { render, screen } from '@testing-library/react';

const body = 'Have a great day!';
const substring = 'great';

const { getByTestId } = screen;

describe('HyperLink component', () => {
  it('can render the TextLink component in place of substring value', () => {
    render(<HyperLink body={body} substring={substring} />);

    const textLink = getByTestId('cf-ui-text-link');

    expect(textLink).toBeVisible();
    expect(textLink.firstChild).toHaveTextContent(substring);
  });

  it('can handle onClick of link', () => {
    const mockOnClick = jest.fn();
    render(<HyperLink body={body} substring={substring} onClick={mockOnClick} />);

    const textLink = getByTestId('cf-ui-text-link');
    textLink.click();
    expect(mockOnClick).toHaveBeenCalled();
  });
});
