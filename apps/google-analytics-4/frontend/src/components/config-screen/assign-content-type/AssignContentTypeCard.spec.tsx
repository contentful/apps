import { render, screen } from '@testing-library/react';
import { AllContentTypes, ContentTypeEntries } from '@/types';
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

const contentTypeEntries: ContentTypeEntries = {
  course: {
    slugField: 'slug',
    urlPrefix: '/about',
  },
};

describe('Assign Content Type Card for Config Screen', () => {
  it('can render the add content type button when there is no saved content type entry', () => {
    render(
      <AssignContentTypeCard
        allContentTypes={{}}
        contentTypeEntries={{}}
        onContentTypeChange={() => {}}
        onContentTypeFieldChange={() => {}}
        onAddContentType={() => {}}
        onRemoveContentType={() => {}}
      />
    );

    expect(screen.getByText('Add a content type')).toBeVisible();
  });

  it('can render the field labels when there is a saved content type entry', () => {
    render(
      <AssignContentTypeCard
        allContentTypes={allContentTypes}
        contentTypeEntries={contentTypeEntries}
        onContentTypeChange={() => {}}
        onContentTypeFieldChange={() => {}}
        onAddContentType={() => {}}
        onRemoveContentType={() => {}}
      />
    );

    expect(screen.getByText('Content type')).toBeVisible();
    expect(screen.getByText('Slug field')).toBeVisible();
    expect(screen.getByText('URL prefix')).toBeVisible();
  });
});
