import { render, screen } from '@testing-library/react';
import { AllContentTypes, AllContentTypeEntries, ContentTypes, ContentTypeEntries } from '@/types';
import AssignContentTypeCard from 'components/config-screen/assign-content-type/AssignContentTypeCard';

const allContentTypes: AllContentTypes = {
  course: {
    name: 'Course',
    fields: [
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
      },
    ],
  },
};

const allContentTypeEntries: AllContentTypeEntries = Object.entries(allContentTypes);

const contentTypes: ContentTypes = {
  course: {
    slugField: 'slug',
    urlPrefix: '/about',
  },
};

const contentTypeEntries: ContentTypeEntries = Object.entries(contentTypes);

describe('Assign Content Type Card for Config Screen', () => {
  it('can render the field labels when there is a saved content type entry', () => {
    render(
      <AssignContentTypeCard
        allContentTypes={allContentTypes}
        allContentTypeEntries={allContentTypeEntries}
        contentTypes={contentTypes}
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
        allContentTypes={allContentTypes}
        allContentTypeEntries={allContentTypeEntries}
        contentTypes={contentTypes}
        contentTypeEntries={contentTypeEntries}
        onContentTypeChange={() => {}}
        onContentTypeFieldChange={() => {}}
        onRemoveContentType={() => {}}
      />
    );

    expect(screen.getAllByTestId('contentTypeRow').length).toBe(1);
  });
});
