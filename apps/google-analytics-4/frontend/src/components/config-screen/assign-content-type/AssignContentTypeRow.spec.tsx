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
const onContentTypeRuleChange = vi.fn();

const props = {
  index: 0,
  allContentTypes,
  allContentTypeEntries,
  contentTypeRules,
  isMissingPattern: false,
  onContentTypeChange,
  onContentTypeFieldChange,
  onContentTypeRuleChange,
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
        contentTypeRule={{ ...contentTypeRules[0], urlPrefix: '/about' }}
        {...props}
      />
    );

    await user.click(screen.getByTestId('advancedMatchingToggle'));

    expect(screen.getByTestId('advancedMatchingPanel')).toBeVisible();
    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-course', {
      enableAdvancedMatching: true,
      pathPattern: '/about/{slug}',
    });
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

  it('clears advanced-only fields when advanced matching is turned off', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[0],
          urlPrefix: '',
          enableAdvancedMatching: true,
          additionalFieldIds: ['slug'],
          pathPattern: '/blog/{slug}',
          matchDimension: 'pagePathPlusQueryString',
          matchType: 'PARTIAL_REGEXP',
        }}
        {...props}
      />
    );

    await user.click(screen.getByTestId('advancedMatchingToggle'));

    expect(screen.queryByTestId('advancedMatchingPanel')).not.toBeInTheDocument();
    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-course', {
      enableAdvancedMatching: false,
      additionalFieldIds: [],
      pathPattern: '',
      matchDimension: 'unifiedPagePathScreen',
      matchType: 'EXACT',
    });
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

  it('explains token usage and updated matching terminology in advanced mode', () => {
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

    expect(
      screen.getByText(
        /A pattern is generated for you automatically\. Edit it if you need a different URL structure/
      )
    ).toBeVisible();
    expect(
      screen.getByText(/Use the placeholder shown next to each field in the pattern\./)
    ).toBeVisible();
    expect(screen.getByText('{sectionSlug}')).toBeVisible();
    expect(screen.getByRole('option', { name: 'Flexible match' })).toBeInTheDocument();
  });

  it('shows missing pattern validation inside the advanced panel', () => {
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[0],
          enableAdvancedMatching: true,
          pathPattern: '',
        }}
        {...props}
        isMissingPattern={true}
      />
    );

    expect(screen.getByText('Add a pattern for this advanced rule before saving.')).toBeVisible();
    expect(screen.getByTestId('advancedMatchingPanel')).toContainElement(
      screen.getByText('Add a pattern for this advanced rule before saving.')
    );
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

    expect(onContentTypeFieldChange).toHaveBeenCalledWith(
      'rule-course',
      'matchDimension',
      'pagePathPlusQueryString'
    );
  });

  it('updates the generated pattern when match dimension changes before customization', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[0],
          urlPrefix: '/article',
          enableAdvancedMatching: true,
          pathPattern: '/article/{articleId}/{slug}',
          additionalFieldIds: ['articleId'],
        }}
        allContentTypes={{
          ...allContentTypes,
          course: {
            name: 'Course',
            fields: [
              { id: 'slug', name: 'Slug', type: 'Symbol' },
              { id: 'articleId', name: 'Article ID', type: 'Symbol' },
            ],
          },
        }}
        allContentTypeEntries={[
          [
            'course',
            {
              name: 'Course',
              fields: [
                { id: 'slug', name: 'Slug', type: 'Symbol' },
                { id: 'articleId', name: 'Article ID', type: 'Symbol' },
              ],
            },
          ],
          allContentTypeEntries[1],
        ]}
        {...props}
      />
    );

    await user.selectOptions(screen.getByTestId('matchDimensionSelect'), [
      'pagePathPlusQueryString',
    ]);

    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-course', {
      matchDimension: 'pagePathPlusQueryString',
      pathPattern: '/article/{slug}?articleId={articleId}',
    });
  });

  it('updates the generated pattern when selected query-string fields change', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          urlPrefix: '/search',
          enableAdvancedMatching: true,
          pathPattern: '/search/{slug}',
          matchDimension: 'pagePathPlusQueryString',
          additionalFieldIds: [],
        }}
        {...props}
      />
    );

    await user.click(screen.getByTestId('additionalFieldOption-sectionSlug'));

    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-category', {
      additionalFieldIds: ['sectionSlug'],
      pathPattern: '/search/{slug}?sectionSlug={sectionSlug}',
    });
  });

  it('updates the generated pattern when selected page-path fields change', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          urlPrefix: '',
          enableAdvancedMatching: true,
          pathPattern: '/{slug}',
          matchDimension: 'unifiedPagePathScreen',
          additionalFieldIds: [],
        }}
        {...props}
      />
    );

    await user.click(screen.getByTestId('additionalFieldOption-sectionSlug'));

    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-category', {
      additionalFieldIds: ['sectionSlug'],
      pathPattern: '/{sectionSlug}/{slug}',
    });
  });

  it('does not overwrite a custom pattern when selected query-string fields change', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          urlPrefix: '/search',
          enableAdvancedMatching: true,
          pathPattern: '/search?category={slug}',
          matchDimension: 'pagePathPlusQueryString',
          additionalFieldIds: [],
        }}
        {...props}
      />
    );

    await user.click(screen.getByTestId('additionalFieldOption-sectionSlug'));

    expect(onContentTypeFieldChange).toHaveBeenCalledWith('rule-category', 'additionalFieldIds', [
      'sectionSlug',
    ]);
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
