import FieldSelectDialog from './FieldSelectDialog';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock the Contentful SDK
const mockSdk = {
  parameters: {
    invocation: {
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol' },
        { id: 'description', name: 'Description', type: 'Text' },
        { id: 'image', name: 'Featured Image', type: 'Link', linkType: 'Asset' },
        { id: 'author', name: 'Author', type: 'Link', linkType: 'Entry' },
        { id: 'tags', name: 'Tags', type: 'Array', items: { type: 'Symbol' } },
        { id: 'published', name: 'Published', type: 'Boolean' },
      ],
    },
  },
  close: vi.fn(),
  hostnames: {
    webapp: 'app.contentful.com',
  },
  window: {
    startAutoResizer: vi.fn(),
    stopAutoResizer: vi.fn(),
  },
};

// Mock the React Apps Toolkit
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('FieldSelectDialog component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the field selection dialog', async () => {
    render(<FieldSelectDialog entry={{}} mappings={[]} />);

    // Check that the component renders with expected title
    expect(screen.getByText('Select Fields to Map to Klaviyo')).toBeInTheDocument();

    // Check that field options are rendered
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('filters out unsupported field types', async () => {
    render(<FieldSelectDialog entry={{}} mappings={[]} />);

    // Boolean fields should not be included in select options
    expect(screen.queryByText('Published')).not.toBeInTheDocument();
  });

  it('selects fields and submits', async () => {
    render(<FieldSelectDialog entry={{}} mappings={[]} />);

    // Select the title field
    const titleCheckbox = screen.getByText('Title');
    fireEvent.click(titleCheckbox);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate mappings/i });
    fireEvent.click(submitButton);

    // Check that SDK close was called with correct data
    expect(mockSdk.close).toHaveBeenCalledWith([{ id: 'title', isAsset: false }]);
  });

  it('selects an image field and submits', async () => {
    render(<FieldSelectDialog entry={{}} mappings={[]} />);

    // Select the image field
    const imageCheckbox = screen.getByText('Featured Image');
    fireEvent.click(imageCheckbox);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /generate mappings/i });
    fireEvent.click(submitButton);

    // Check that SDK close was called with correct data
    expect(mockSdk.close).toHaveBeenCalledWith([{ id: 'image', isAsset: true }]);
  });

  it('allows canceling the dialog', async () => {
    render(<FieldSelectDialog entry={{}} mappings={[]} />);

    // Click the cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Check that SDK close was called with empty array
    expect(mockSdk.close).toHaveBeenCalledWith([]);
  });
});
