import HyperLink from './HyperLink';
import { render, screen } from '@testing-library/react';

const BODY = 'Have a great day!';
const SUBSTRING = 'great';

const { getByTestId } = screen;

describe('HyperLink component', () => {
  it('can render the TextLink component in place of substring value', () => {
    render(<HyperLink body={BODY} substring={SUBSTRING} />);

    const textLink = getByTestId('cf-ui-text-link');

    expect(textLink).toBeInTheDocument();
    expect(textLink.firstChild).toHaveTextContent(SUBSTRING);
  });

  it('can handle onClick of link', () => {
    const mockOnClick = jest.fn();
    render(<HyperLink body={BODY} substring={SUBSTRING} onClick={mockOnClick} />);

    const textLink = getByTestId('cf-ui-text-link');
    textLink.click();
    expect(mockOnClick).toHaveBeenCalled();
  });
});
