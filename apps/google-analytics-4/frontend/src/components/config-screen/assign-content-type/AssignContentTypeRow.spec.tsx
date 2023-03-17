import { render, screen } from '@testing-library/react';
import { AllContentTypes, AllContentTypeEntries, ContentTypes } from 'types';
import AssignContentTypeRow from 'components/config-screen/assign-content-type/AssignContentTypeRow';

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
  category: {
    name: 'Category',
    fields: [
      {
        id: 'title',
        name: 'Title',
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
  category: {
    slugField: 'title',
    urlPrefix: '',
  },
};

describe('Assign Content Type Card for Config Screen', () => {
  it('shows invalid and disabled inputs when content type is empty', () => {
    render(
      <AssignContentTypeRow
        contentTypeEntry={[
          '',
          {
            slugField: '',
            urlPrefix: '',
          },
        ]}
        index={0}
        allContentTypes={allContentTypes}
        allContentTypeEntries={allContentTypeEntries}
        contentTypes={contentTypes}
        onContentTypeChange={() => {}}
        onContentTypeFieldChange={() => {}}
        onRemoveContentType={() => {}}
      />
    );

    expect(screen.getByTestId('noStatus')).toBeVisible();
    expect(screen.getByTestId('contentTypeSelect')).toBeInvalid();
    expect(screen.getByTestId('slugFieldSelect')).toBeDisabled();
    expect(screen.getByTestId('urlPrefixInput')).toBeDisabled();
  });

  it('can render a warning icon when slug field is not selected', () => {
    render(
      <AssignContentTypeRow
        contentTypeEntry={[
          'category',
          {
            slugField: '',
            urlPrefix: '',
          },
        ]}
        index={0}
        allContentTypes={allContentTypes}
        allContentTypeEntries={allContentTypeEntries}
        contentTypes={contentTypes}
        onContentTypeChange={() => {}}
        onContentTypeFieldChange={() => {}}
        onRemoveContentType={() => {}}
      />
    );

    expect(screen.getByTestId('warningIcon')).toBeVisible();
  });
});
