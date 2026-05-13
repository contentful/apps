import { fireEvent, render, screen, within } from '@testing-library/react';
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
      { id: 'articleId', name: 'Article ID', type: 'Integer' },
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
  unknownPatternTokens: [],
  missingSelectedPatternTokens: [],
  isDuplicateConfiguration: false,
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

  it('does not show integer fields in the standard slug field dropdown', () => {
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          enableAdvancedMatching: false,
        }}
        {...props}
      />
    );

    const slugFieldSelect = screen.getByTestId('slugFieldSelect');

    expect(within(slugFieldSelect).getByRole('option', { name: 'Title' })).toBeVisible();
    expect(within(slugFieldSelect).queryByRole('option', { name: 'Article ID' })).toBeNull();
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
    expect(screen.queryByTestId('slugFieldSelect')).not.toBeInTheDocument();
  });

  it('preserves advanced-only fields when advanced matching is turned off', async () => {
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
        'Build a custom path pattern for the analytics shown while editing an entry of the chosen content type. Use short text and integer fields to insert entry values into the path.'
      )
    ).toBeVisible();
    expect(screen.getByText('Select entry fields to insert into your path pattern')).toBeVisible();
    expect(screen.getByText(/sectionSlug/)).toBeVisible();
    expect(screen.getByText('Locale')).toBeVisible();
    expect(screen.getByText('Insert locale into Pattern')).toBeVisible();
    expect(screen.getByText(/Use \* when part of the URL can vary\./)).toBeVisible();
    expect(screen.getByText(/\/shop\/products\/\{product_id\}/)).toBeVisible();
  });


  it('adds the locale token to a custom pattern', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          enableAdvancedMatching: true,
          pathPattern: '/products/{slug}',
        }}
        {...props}
      />
    );

    await user.click(screen.getByTestId('localePatternOption'));

    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-category', {
      pathPattern: '/{locale}/products/{slug}',
      matchType: 'EXACT',
    });
  });

  it('allows integer fields as advanced pattern variables', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          enableAdvancedMatching: true,
          additionalFieldIds: [],
          pathPattern: '/article',
          matchDimension: 'pagePathPlusQueryString',
        }}
        {...props}
      />
    );

    expect(screen.getByText(/articleId/)).toBeVisible();

    await user.click(screen.getByTestId('additionalFieldOption-articleId'));

    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-category', {
      additionalFieldIds: ['articleId'],
      pathPattern: '/article?articleId={articleId}',
      matchType: 'EXACT',
    });
  });

  it('lists all content type fields as advanced pattern variables', () => {
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          enableAdvancedMatching: true,
          additionalFieldIds: [],
          pathPattern: '/{slug}',
        }}
        {...props}
      />
    );

    expect(screen.getByText(/title/)).toBeVisible();
    expect(screen.getByText(/sectionSlug/)).toBeVisible();
  });

  it('does not show configured below headers in advanced mode', () => {
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[0],
          urlPrefix: '/about',
          enableAdvancedMatching: true,
          pathPattern: '',
        }}
        {...props}
      />
    );

    expect(screen.queryByText('Configured below')).not.toBeInTheDocument();
  });

  it('shows a duplicate configuration error when the same rule is repeated', () => {
    render(
      <AssignContentTypeRow
        contentTypeRule={contentTypeRules[0]}
        {...props}
        isDuplicateConfiguration={true}
      />
    );

    expect(
      screen.getByText(
        'This rule duplicates another configuration. Remove one of them or change one of the values before saving.'
      )
    ).toBeVisible();
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

    expect(screen.getByTestId('pathPatternInput')).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText('Pattern is required. Enter a value for the Pattern field before saving.')
    );
    expect(screen.getByTestId('advancedMatchingPanel')).toContainElement(
      screen.getByText('Pattern is required. Enter a value for the Pattern field before saving.')
    );
  });

  it('shows unknown variable validation inside the advanced panel', () => {
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[0],
          enableAdvancedMatching: true,
          pathPattern: '/{sectoinSlug}/{slug}',
        }}
        {...props}
        unknownPatternTokens={['sectoinSlug']}
      />
    );

    expect(screen.getByTestId('pathPatternInput')).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText(
        'Pattern contains an unknown variable: {sectoinSlug}. Use the variables shown on the left.'
      )
    ).toBeVisible();
  });

  it('shows selected field validation inside the advanced panel', () => {
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          enableAdvancedMatching: true,
          additionalFieldIds: ['sectionSlug'],
          pathPattern: '/products/{slug}',
        }}
        {...props}
        missingSelectedPatternTokens={['sectionSlug']}
      />
    );

    expect(screen.getByTestId('pathPatternInput')).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText(
        'Pattern is missing a substitution tag for the selected entry field: {sectionSlug}. Add the tag to Pattern or uncheck that field.'
      )
    ).toBeVisible();
  });

  it('calls field change handler when path pattern input is changed', async () => {
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

    fireEvent.change(screen.getByTestId('pathPatternInput'), {
      target: { value: '/blog/{slug}' },
    });

    expect(onContentTypeRuleChange).toHaveBeenLastCalledWith('rule-course', {
      pathPattern: '/blog/{slug}',
      matchType: 'EXACT',
    });
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

    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-course', {
      matchDimension: 'pagePathPlusQueryString',
      pathPattern: '/article?articleId={slug}',
      matchType: 'EXACT',
    });
  });

  it('updates the match dimension without overwriting a custom pattern', async () => {
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
      pathPattern: '/article/{articleId}/{slug}',
      matchType: 'EXACT',
    });
  });

  it('updates selected query-string fields and regenerates the pattern when it is still automatic', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          urlPrefix: '/search',
          enableAdvancedMatching: true,
          pathPattern: '/',
          matchDimension: 'pagePathPlusQueryString',
          additionalFieldIds: [],
        }}
        {...props}
      />
    );

    await user.click(screen.getByTestId('additionalFieldOption-sectionSlug'));

    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-category', {
      additionalFieldIds: ['sectionSlug'],
      pathPattern: '/?sectionSlug={sectionSlug}',
      matchType: 'EXACT',
    });
  });

  it('updates selected page-path fields and regenerates the pattern when it is still automatic', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          urlPrefix: '',
          enableAdvancedMatching: true,
          pathPattern: '/',
          matchDimension: 'unifiedPagePathScreen',
          additionalFieldIds: [],
        }}
        {...props}
      />
    );

    await user.click(screen.getByTestId('additionalFieldOption-sectionSlug'));

    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-category', {
      additionalFieldIds: ['sectionSlug'],
      pathPattern: '/{sectionSlug}',
      matchType: 'EXACT',
    });
  });

  it('appends a newly selected field variable to the end of the existing pattern', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[1],
          contentTypeId: 'category',
          slugField: 'title',
          urlPrefix: '',
          enableAdvancedMatching: true,
          pathPattern: '/news/{title}',
          matchDimension: 'unifiedPagePathScreen',
          additionalFieldIds: ['title'],
        }}
        {...props}
      />
    );

    await user.click(screen.getByTestId('additionalFieldOption-sectionSlug'));

    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-category', {
      additionalFieldIds: ['title', 'sectionSlug'],
      pathPattern: '/news/{title}/{sectionSlug}',
      matchType: 'EXACT',
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

    expect(onContentTypeRuleChange).toHaveBeenCalledWith('rule-category', {
      additionalFieldIds: ['sectionSlug'],
      pathPattern: '/search?category={slug}&sectionSlug={sectionSlug}',
      matchType: 'EXACT',
    });
  });

  it('infers regex matching when the pattern includes wildcard syntax', async () => {
    const user = userEvent.setup();
    render(
      <AssignContentTypeRow
        contentTypeRule={{
          ...contentTypeRules[0],
          urlPrefix: '',
          enableAdvancedMatching: true,
          pathPattern: '/article*{slug}',
          matchDimension: 'pagePathPlusQueryString',
          matchType: 'EXACT',
        }}
        {...props}
      />
    );

    fireEvent.change(screen.getByTestId('pathPatternInput'), {
      target: { value: '/article*/{slug}' },
    });

    expect(onContentTypeRuleChange).toHaveBeenLastCalledWith('rule-course', {
      pathPattern: '/article*/{slug}',
      matchType: 'PARTIAL_REGEXP',
    });
  });
});
