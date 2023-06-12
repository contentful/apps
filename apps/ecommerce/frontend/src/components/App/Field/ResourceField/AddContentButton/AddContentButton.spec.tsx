import React from 'react';
import { AddContentButton } from './AddContentButton';
import { render, screen, fireEvent } from '@testing-library/react';

const { getByText } = screen;

describe('AddContentButton component', () => {
  const mockUseContext: jest.SpyInstance = jest.spyOn(React, 'useContext');
  const mockHandleAddContent = jest.fn();

  beforeEach(() => {
    mockUseContext.mockReturnValue({
      handleAddContent: mockHandleAddContent,
    });
  });

  it('mounts', () => {
    render(<AddContentButton />);

    expect(getByText('Add content')).toBeVisible();
  });

  it('handles adding content', () => {
    render(<AddContentButton />);

    fireEvent.click(getByText('Add content'));

    expect(mockHandleAddContent).toHaveBeenCalled();
  });
});
