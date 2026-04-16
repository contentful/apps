import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AllContentTypes, AllContentTypeEntries, ContentTypeRule, ContentTypeRules } from 'types';
import AssignContentTypeRow from 'components/config-screen/assign-content-type/AssignContentTypeRow';
import { vi } from 'vitest';

const allContentTypes: AllContentTypes = {
  course: {
    name: 'Course',
    fields: [{ id: 'slug', name: 'Slug', type: 'Symbol' }],
  },
  category: {
    name: 'Category',
    fields: [
      { id: 'title', name: 'Title', type: 'Symbol' },
      { id: 'sectionSlug', name: 'Section slug', type: 'Symbol' },
    ],
  },
};

const allContentTypeEntries: AllContentTypeEntries = Object.entries(allContentTypes);

const contentTypeRules: ContentTypeRules = [
  {
    id: 'rule-course',
    contentTypeId: 'course',
    slugField: 'slug',
    urlPrefix: '/about',
    enableAdvancedMatching: false,
    pathPattern: '',
    matchDimension: 'unifiedPagePathScreen',
    matchType: 'EXACT',
  },
  {
    id: 'rule-category',
    contentTypeId: 'category',
    slugField: 'title',
    urlPrefix: '',
    enableAdvancedMatching: false,
    pathPattern: '',
    matchDimension: 'unifiedPagePathScreen',
    matchType: 'EXACT',
  },
];

const onRemoveContentType = vi.fn();
const onContentTypeChange = vi.fn();
const onContentTypeFieldChange = vi.fn();

const props = {
  index: 0,
  allContentTypes,
  allContentTypeEntries,
  contentTypeRules,
  onContentTypeChange,
  onContentTypeFieldChange,
  onRemoveContentType,
  currentEditorInterface: {},
  originalContentTypeRules: [],
  focus: false,
};

describe('Assign Content Type Card for Config Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows disabled inputs when content type is empty', () => {
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          id: 'rule-empty',
          contentTypeId: '',
          slugField: '',
          urlPrefix: '',
          enableAdvancedMatching: false,
          pathPattern: '',
          matchDimension: 'unifiedPagePathScreen',
          matchType: 'EXACT',
        }}
        {...props}
      />
    );

    expect(screen.getByTestId('slugFieldSelect')).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Advanced' })).toBeDisabled();
    expect(screen.queryByTestId('advancedMatchingPanel')).not.toBeInTheDocument();
    expect(screen.getByTestId('urlPrefixInput')).toBeVisible();
  });

  it('calls remove handler when remove link is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          id: 'rule-empty',
          contentTypeId: '',
          slugField: '',
          urlPrefix: '',
          enableAdvancedMatching: false,
          pathPattern: '',
          matchDimension: 'unifiedPagePathScreen',
          matchType: 'EXACT',
        }}
        {...props}
      />
    );

    await user.click(screen.getByText('Remove'));

    expect(onRemoveContentType).toHaveBeenCalled();
  });

  it('calls change handler when content type selection is changed', async () => {
    const user = userEvent.setup();
    render(<AssignContentTypeRow contentTypeRule={contentTypeRules[0]} {...props} />);

    await user.selectOptions(screen.getByTestId('contentTypeSelect'), ['course']);

    expect(onContentTypeChange).toHaveBeenCalled();
  });

  it('calls field change handler when slug field selection is changed', async () => {
    const user = userEvent.setup();
    render(<AssignContentTypeRow contentTypeRule={contentTypeRules[0]} {...props} />);

    await user.selectOptions(screen.getByTestId('slugFieldSelect'), ['slug']);

    expect(onContentTypeFieldChange).toHaveBeenCalled();
  });

  it('calls field change handler when url prefix input is changed', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{ ...contentTypeRules[0], urlPrefix: '' }}
        {...props}
      />
    );

    await user.type(screen.getByTestId('urlPrefixInput'), '/en-US');

    expect(onContentTypeFieldChange).toHaveBeenCalled();
  });

  it('reveals advanced matching controls when advanced toggle is enabled', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{ ...contentTypeRules[0], urlPrefix: '' }}
        {...props}
      />
    );

    await user.click(screen.getByTestId('advancedMatchingToggle'));

    expect(screen.getByTestId('advancedMatchingPanel')).toBeVisible();
    expect(onContentTypeFieldChange).toHaveBeenCalledWith(
      'rule-course',
      'enableAdvancedMatching',
      true
    );
  });

  it('shows advanced matching controls when a row is already configured for them', () => {
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[0],
          urlPrefix: '',
          enableAdvancedMatching: true,
          pathPattern: '/blog/{slug}',
        }}
        {...props}
      />
    );

    expect(screen.getByTestId('advancedMatchingPanel')).toBeVisible();
    expect(screen.getByTestId('pathPatternInput')).toHaveValue('/blog/{slug}');
    expect(screen.queryByTestId('urlPrefixInput')).not.toBeInTheDocument();
  });

  it('shows a preview with additional page property tokens when configured', () => {
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          enableAdvancedMatching: true,
          additionalFieldIds: ['sectionSlug'],
          pathPattern: '/{sectionSlug}/{slug}',
        }}
        {...props}
      />
    );

    expect(screen.getByTestId('pathPatternInput')).toHaveValue('/{sectionSlug}/{slug}');
  });

  it('calls field change handler when path pattern input is changed', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[0],
          urlPrefix: '',
          enableAdvancedMatching: true,
          pathPattern: '',
        }}
        {...props}
      />
    );

    await user.type(screen.getByTestId('pathPatternInput'), '/blog/{slug}');

    expect(onContentTypeFieldChange).toHaveBeenCalled();
  });

  it('calls field change handler when match dimension selection is changed', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[0],
          urlPrefix: '',
          enableAdvancedMatching: true,
          pathPattern: '/article?articleId={slug}',
        }}
        {...props}
      />
    );

    await user.selectOptions(screen.getByTestId('matchDimensionSelect'), [
      'pagePathPlusQueryString',
    ]);

    expect(onContentTypeFieldChange).toHaveBeenCalled();
  });

  it('calls field change handler when matching mode selection is changed', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[0],
          urlPrefix: '',
          enableAdvancedMatching: true,
          pathPattern: '/article.*{slug}',
          matchDimension: 'pagePathPlusQueryString',
          matchType: 'EXACT',
        }}
        {...props}
      />
    );

    await user.selectOptions(screen.getByTestId('matchTypeSelect'), ['PARTIAL_REGEXP']);

    expect(onContentTypeFieldChange).toHaveBeenCalled();
  });
});
