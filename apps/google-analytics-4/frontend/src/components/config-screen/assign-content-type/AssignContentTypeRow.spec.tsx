import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const onRemoveContentType = jest.fn();
const onContentTypeChange = jest.fn();
const onContentTypeFieldChange = jest.fn();

const props = {
  index: 0,
  allContentTypes: allContentTypes,
  allContentTypeEntries: allContentTypeEntries,
  contentTypes: contentTypes,
  onContentTypeChange: onContentTypeChange,
  onContentTypeFieldChange: onContentTypeFieldChange,
  onRemoveContentType: onRemoveContentType,
  currentEditorInterface: {},
  originalContentTypes: {},
  focus: false,
};

describe('Assign Content Type Card for Config Screen', () => {
  it('shows disabled inputs when content type is empty', () => {
    render(
      <AssignContentTypeRow
        contentTypeEntry={[
          '',
          {
            slugField: '',
            urlPrefix: '',
          },
        ]}
        {...props}
      />
    );

    expect(screen.getByTestId('slugFieldSelect')).toBeDisabled();
    expect(screen.getByTestId('urlPrefixInput')).toBeDisabled();
  });

  it('calls remove handler when remove link is clicked', async () => {
    render(
      <AssignContentTypeRow
        contentTypeEntry={[
          '',
          {
            slugField: '',
            urlPrefix: '',
          },
        ]}
        {...props}
      />
    );

    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Remove'));

    expect(onRemoveContentType).toHaveBeenCalled();
  });

  it('calls remove handler when remove link is clicked', async () => {
    render(
      <AssignContentTypeRow
        contentTypeEntry={[
          '',
          {
            slugField: '',
            urlPrefix: '',
          },
        ]}
        {...props}
      />
    );

    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Remove'));

    expect(onRemoveContentType).toHaveBeenCalled();
  });

  it('calls change handler when content type selection is changed', async () => {
    render(
      <AssignContentTypeRow
        contentTypeEntry={[
          'course',
          {
            slugField: 'slug',
            urlPrefix: '/about',
          },
        ]}
        {...props}
      />
    );

    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.selectOptions(screen.getByTestId('contentTypeSelect'), ['course']);

    expect(onContentTypeChange).toHaveBeenCalled();
  });

  it('calls field change handler when slug field selection is changed', async () => {
    render(
      <AssignContentTypeRow
        contentTypeEntry={[
          'course',
          {
            slugField: 'slug',
            urlPrefix: '/about',
          },
        ]}
        {...props}
      />
    );

    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.selectOptions(screen.getByTestId('slugFieldSelect'), ['slug']);

    expect(onContentTypeFieldChange).toHaveBeenCalled();
  });

  it('calls field change handler when url prefix input is changed', async () => {
    render(
      <AssignContentTypeRow
        contentTypeEntry={[
          'course',
          {
            slugField: 'slug',
            urlPrefix: '',
          },
        ]}
        {...props}
      />
    );

    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.type(screen.getByTestId('urlPrefixInput'), '/en-US');

    expect(onContentTypeFieldChange).toHaveBeenCalled();
  });
});
