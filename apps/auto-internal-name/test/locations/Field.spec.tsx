import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import Field from '../../src/locations/Field';

const mockUseAutoResizer = vi.fn();
const mockSingleLineEditor = vi.fn(({ field, locales }: any) => (
  <div data-test-id="single-line-editor">
    <input
      value={field.getValue() || ''}
      onChange={(e) => field.setValue(e.target.value)}
      placeholder="Enter your new value"
    />
    <span>{JSON.stringify(locales)}</span>
  </div>
));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => mockUseAutoResizer(),
}));

vi.mock('@contentful/field-editor-single-line', () => ({
  SingleLineEditor: (props: any) => mockSingleLineEditor(props),
}));

describe('Field component', () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.field.getValue.mockReturnValue('');
    mockSdk.field.setValue.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  describe('Rendering', () => {
    it('should render the component with all required elements', () => {
      render(<Field />);

      expect(screen.getByTestId('single-line-editor')).toBeInTheDocument();
      const clearButton = screen.getByLabelText('Clear value');
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveAttribute('title', 'Clear value');
      const refetchButton = screen.getByLabelText('Refetch value from parent');
      expect(refetchButton).toBeInTheDocument();
    });
  });

  describe('Clear button functionality', () => {
    it('should call setValue with empty string when Clear button is clicked', () => {
      render(<Field />);

      const clearButton = screen.getByLabelText('Clear value');
      fireEvent.click(clearButton);

      expect(mockSdk.field.setValue).toHaveBeenCalledTimes(1);
      expect(mockSdk.field.setValue).toHaveBeenCalledWith('');
    });
  });

  describe('Refetch button functionality', () => {
    it('should log message when Refetch button is clicked', () => {
      render(<Field />);

      const refetchButton = screen.getByLabelText('Refetch value from parent');
      fireEvent.click(refetchButton);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Refetch value from parent');
    });

    it('should allow multiple refetch button clicks', () => {
      render(<Field />);

      const refetchButton = screen.getByLabelText('Refetch value from parent');
      fireEvent.click(refetchButton);
      fireEvent.click(refetchButton);
      fireEvent.click(refetchButton);

      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });
  });
});
