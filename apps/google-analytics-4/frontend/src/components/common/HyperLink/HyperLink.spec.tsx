import HyperLink from './HyperLink';
import { render, screen } from '@testing-library/react';

const BODY = 'Have a great day!';
const SUBSTRING = 'great';

describe('HyperLink component', () => {
  it('can render the TextLink component in place of substring value', () => {
    render(<HyperLink body={BODY} substring={SUBSTRING} />);

    expect(screen.getByTestId('cf-ui-text-link')).toBeInTheDocument();
    expect(screen.getByTestId('cf-ui-text-link').firstChild).toHaveTextContent(SUBSTRING);
  });

  it('can handle onClick of link', () => {
    const mockOnClick = jest.fn();
    render(<HyperLink body={BODY} substring={SUBSTRING} onClick={mockOnClick} />);

    const textLink = screen.getByTestId('cf-ui-text-link');
    textLink.click();
    expect(mockOnClick).toHaveBeenCalled();
  });
});
