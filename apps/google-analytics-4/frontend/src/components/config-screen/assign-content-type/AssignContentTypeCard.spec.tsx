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
  it('can render the add content type button when there is no saved content type entry', () => {
    render(
      <AssignContentTypeCard
        allContentTypes={{}}
        allContentTypeEntries={[]}
        contentTypes={{}}
        hasContentTypes={false}
        contentTypeEntries={[]}
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
        allContentTypeEntries={allContentTypeEntries}
        contentTypes={contentTypes}
        hasContentTypes={true}
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
