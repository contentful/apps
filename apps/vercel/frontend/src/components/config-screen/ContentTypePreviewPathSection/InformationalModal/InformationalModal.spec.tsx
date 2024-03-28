import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { InformationalModal } from './InformationalModal';
import { copies } from '@constants/copies';

const { title, button, exampleOne, exampleTwo, exampleThree } =
  copies.configPage.contentTypePreviewPathSection.exampleModal;

describe('InformationalModal', () => {
  it('renders content when modal is shown', () => {
    render(<InformationalModal onClose={vi.fn()} isShown={true} />);
    const modalTitle = screen.getByText(title);
    const modalButton = screen.getByText(button);
    const exampleOneDescription = screen.getByText(exampleOne.description);
    const exampleTwoDescription = screen.getByText(exampleTwo.description);
    const exampleThreeDescription = screen.getByText(exampleThree.description);

    expect(modalTitle).toBeTruthy();
    expect(modalButton).toBeTruthy();
    expect(exampleOneDescription).toBeTruthy();
    expect(exampleTwoDescription).toBeTruthy();
    expect(exampleThreeDescription).toBeTruthy();
  });
});
