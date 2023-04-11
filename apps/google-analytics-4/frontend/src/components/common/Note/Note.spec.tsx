import { render, screen } from '@testing-library/react';
import Note from './Note';

const BODY = 'This is note content';

const { getByText, getByTestId } = screen;

describe('Note component', () => {
  it('mounts', () => {
    render(<Note body={BODY} variant="warning" />);

    const note = getByTestId('cf-ui-note');
    const paragraph = getByText(BODY);

    expect(note).toBeInTheDocument();
    expect(paragraph).toBeInTheDocument();
  });
});
