import { render, screen } from '@testing-library/react';
import { AllContentTypeEntries, ContentTypeEntries } from 'types';
import { mockAllContentTypesComplete, mockContentTypes } from '../../../../test/mocks';
import AssignContentTypeCard from 'components/config-screen/assign-content-type/AssignContentTypeCard';

const allContentTypeEntries: AllContentTypeEntries = Object.entries(mockAllContentTypesComplete);

const contentTypeEntries: ContentTypeEntries = Object.entries(mockContentTypes);

describe('Assign Content Type Card for Config Screen', () => {
  it('can render the field labels when there is a saved content type entry', () => {
    render(
      <AssignContentTypeCard
        allContentTypes={mockAllContentTypesComplete}
        allContentTypeEntries={allContentTypeEntries}
        contentTypes={mockContentTypes}
        contentTypeEntries={contentTypeEntries}
        onContentTypeChange={() => {}}
        onContentTypeFieldChange={() => {}}
        onRemoveContentType={() => {}}
      />
    );

    expect(screen.getByText('Content type')).toBeVisible();
    expect(screen.getByText('Slug field')).toBeVisible();
    expect(screen.getByText('URL prefix')).toBeVisible();
  });

  it('can render the correct number of saved content types', () => {
    render(
      <AssignContentTypeCard
        allContentTypes={mockAllContentTypesComplete}
        allContentTypeEntries={allContentTypeEntries}
        contentTypes={mockContentTypes}
        contentTypeEntries={contentTypeEntries}
        onContentTypeChange={() => {}}
        onContentTypeFieldChange={() => {}}
        onRemoveContentType={() => {}}
      />
    );

    expect(screen.getAllByTestId('contentTypeRow').length).toBe(3);
  });
});
