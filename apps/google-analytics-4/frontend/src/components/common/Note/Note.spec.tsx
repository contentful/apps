import { render, screen } from '@testing-library/react';
import Note from './Note';

const BODY = 'This is note content';

const { getByText } = screen;

describe('Note component', () => {
  it('mounts', () => {
    const { getByTestId } = render(<Note body={BODY} variant="warning" />);

    const note = getByTestId('cf-ui-note');
    const paragraph = getByText(BODY);

    expect(note).toBeTruthy();
    expect(paragraph).toBeTruthy();
  });
});
