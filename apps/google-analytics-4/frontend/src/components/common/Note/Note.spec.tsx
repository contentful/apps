import { render, screen } from '@testing-library/react';
import Note from './Note';

const BODY = 'This is note content';

describe('Note component', () => {
  it('mounts', () => {
    render(<Note body={BODY} variant="warning" />);

    expect(screen.getByTestId('cf-ui-note')).toBeInTheDocument();
    expect(screen.getByText(BODY)).toBeInTheDocument();
  });
});
