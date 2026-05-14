import { render, screen, waitFor } from '@testing-library/react';
import { mockSdk, mockCma } from '../../../../test/mocks';
import AssignContentTypeSection from 'components/config-screen/assign-content-type/AssignContentTypeSection';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

describe('Assign Content Type Section for Config Screen', () => {
  it('can render the section heading and trailing slash checkbox', () => {
    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={() => {}}
        parameters={{}}
        currentEditorInterface={{}}
        originalContentTypes={{}}
        originalContentTypeRules={[]}
        showPatternValidation={false}
      />
    );

    expect(screen.getByText('Content type configuration')).toBeVisible();
    expect(
      screen.getByText(
        'Configure the content types whose entries should show Google Analytics data in the editor sidebar. For each content type, define how the app should match the entry to a page path: use a slug field and optional prefix for standard paths, or enable advanced matching to build a custom path pattern with entry field values, a locale, and wildcards.'
      )
    ).toBeVisible();
    expect(screen.getByText('Append a trailing slash to all page paths')).toBeVisible();
  });

  it('marks advanced rules without a pattern as invalid', async () => {
    const onIsValidContentTypeAssignment = vi.fn();

    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={onIsValidContentTypeAssignment}
        parameters={{
          contentTypeRules: [
            {
              id: 'rule-1',
              contentTypeId: 'searchPage',
              slugField: 'slug',
              urlPrefix: '',
              enableAdvancedMatching: true,
              pathPattern: '',
              matchDimension: 'pagePathPlusQueryString',
              matchType: 'EXACT',
            },
          ],
        }}
        currentEditorInterface={{}}
        originalContentTypes={{}}
        originalContentTypeRules={[]}
        showPatternValidation={true}
      />
    );

    expect(
      await screen.findByText(
        'Pattern is required. Enter a value for the Pattern field before saving.'
      )
    ).toBeVisible();

    await waitFor(() => expect(onIsValidContentTypeAssignment).toHaveBeenLastCalledWith(false));
  });

  it('marks advanced rules with unknown pattern variables as invalid', async () => {
    const onIsValidContentTypeAssignment = vi.fn();

    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={onIsValidContentTypeAssignment}
        parameters={{
          contentTypeRules: [
            {
              id: 'rule-1',
              contentTypeId: 'searchPage',
              slugField: 'slug',
              urlPrefix: '',
              enableAdvancedMatching: true,
              pathPattern: '/search/{sectoinSlug}/{sectionSlug}',
              additionalFieldIds: ['sectionSlug'],
              matchDimension: 'unifiedPagePathScreen',
              matchType: 'EXACT',
            },
          ],
        }}
        currentEditorInterface={{}}
        originalContentTypes={{}}
        originalContentTypeRules={[]}
        showPatternValidation={true}
      />
    );

    expect(
      await screen.findByText(
        'Pattern contains an unknown variable: {sectoinSlug}. Use the variables shown on the left.'
      )
    ).toBeVisible();

    await waitFor(() => expect(onIsValidContentTypeAssignment).toHaveBeenLastCalledWith(false));
  });

  it('marks advanced rules with selected fields missing from the pattern as invalid', async () => {
    const onIsValidContentTypeAssignment = vi.fn();

    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={onIsValidContentTypeAssignment}
        parameters={{
          contentTypeRules: [
            {
              id: 'rule-1',
              contentTypeId: 'searchPage',
              slugField: 'slug',
              urlPrefix: '',
              enableAdvancedMatching: true,
              pathPattern: '/search/{slug}',
              additionalFieldIds: ['sectionSlug', 'articleId'],
              matchDimension: 'unifiedPagePathScreen',
              matchType: 'EXACT',
            },
          ],
        }}
        currentEditorInterface={{}}
        originalContentTypes={{}}
        originalContentTypeRules={[]}
        showPatternValidation={true}
      />
    );

    expect(
      await screen.findByText(
        'Pattern is missing substitution tags for selected entry fields: {sectionSlug}, {articleId}. Add the tags to Pattern or uncheck those fields.'
      )
    ).toBeVisible();

    await waitFor(() => expect(onIsValidContentTypeAssignment).toHaveBeenLastCalledWith(false));
  });

  it('allows advanced rules to use the locale token', async () => {
    const onIsValidContentTypeAssignment = vi.fn();

    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={onIsValidContentTypeAssignment}
        parameters={{
          contentTypeRules: [
            {
              id: 'rule-1',
              contentTypeId: 'searchPage',
              slugField: 'slug',
              urlPrefix: '',
              enableAdvancedMatching: true,
              pathPattern: '/{locale}/{slug}',
              additionalFieldIds: [],
              matchDimension: 'unifiedPagePathScreen',
              matchType: 'EXACT',
            },
          ],
        }}
        currentEditorInterface={{}}
        originalContentTypes={{}}
        originalContentTypeRules={[]}
        showPatternValidation={true}
      />
    );

    await waitFor(() => expect(onIsValidContentTypeAssignment).toHaveBeenLastCalledWith(true));
    expect(screen.queryByText(/Pattern contains an unknown variable/)).not.toBeInTheDocument();
  });

  it('allows advanced rules to use the configured slug token', async () => {
    const onIsValidContentTypeAssignment = vi.fn();

    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={onIsValidContentTypeAssignment}
        parameters={{
          contentTypeRules: [
            {
              id: 'rule-1',
              contentTypeId: 'searchPage',
              slugField: 'slug',
              urlPrefix: '',
              enableAdvancedMatching: true,
              pathPattern: '/search/{slug}/{sectionSlug}',
              additionalFieldIds: ['sectionSlug'],
              matchDimension: 'unifiedPagePathScreen',
              matchType: 'EXACT',
            },
          ],
        }}
        currentEditorInterface={{}}
        originalContentTypes={{}}
        originalContentTypeRules={[]}
        showPatternValidation={true}
      />
    );

    await waitFor(() => expect(onIsValidContentTypeAssignment).toHaveBeenLastCalledWith(true));
    expect(screen.queryByText(/Pattern contains an unknown variable/)).not.toBeInTheDocument();
  });

  it('ignores hidden advanced pattern tokens when advanced matching is disabled', async () => {
    const onIsValidContentTypeAssignment = vi.fn();

    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={onIsValidContentTypeAssignment}
        parameters={{
          contentTypeRules: [
            {
              id: 'rule-1',
              contentTypeId: 'searchPage',
              slugField: 'slug',
              urlPrefix: '',
              enableAdvancedMatching: false,
              pathPattern: '/search/{staleToken}',
              additionalFieldIds: [],
              matchDimension: 'unifiedPagePathScreen',
              matchType: 'EXACT',
            },
          ],
        }}
        currentEditorInterface={{}}
        originalContentTypes={{}}
        originalContentTypeRules={[]}
        showPatternValidation={true}
      />
    );

    await waitFor(() => expect(onIsValidContentTypeAssignment).toHaveBeenLastCalledWith(true));
    expect(screen.queryByText(/Pattern contains an unknown variable/)).not.toBeInTheDocument();
  });

  it('marks exact duplicate rules as invalid', async () => {
    const onIsValidContentTypeAssignment = vi.fn();

    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={onIsValidContentTypeAssignment}
        parameters={{
          contentTypeRules: [
            {
              id: 'rule-1',
              contentTypeId: 'blogPost',
              slugField: 'slug',
              urlPrefix: '/blog/',
              enableAdvancedMatching: false,
              pathPattern: '',
              matchDimension: 'unifiedPagePathScreen',
              matchType: 'EXACT',
            },
            {
              id: 'rule-2',
              contentTypeId: 'blogPost',
              slugField: 'slug',
              urlPrefix: '/blog/',
              enableAdvancedMatching: false,
              pathPattern: '',
              matchDimension: 'unifiedPagePathScreen',
              matchType: 'EXACT',
            },
          ],
        }}
        currentEditorInterface={{}}
        originalContentTypes={{}}
        originalContentTypeRules={[]}
        showPatternValidation={true}
      />
    );

    expect(
      await screen.findAllByText(
        'This rule duplicates another configuration. Remove one of them or change one of the values before saving.'
      )
    ).toHaveLength(2);

    await waitFor(() => expect(onIsValidContentTypeAssignment).toHaveBeenLastCalledWith(false));
  });

  it('keeps trailing slash enabled when any rule uses advanced matching', async () => {
    render(
      <AssignContentTypeSection
        mergeSdkParameters={() => {}}
        onIsValidContentTypeAssignment={() => {}}
        parameters={{
          forceTrailingSlash: true,
          contentTypeRules: [
            {
              id: 'rule-1',
              contentTypeId: 'searchPage',
              slugField: 'slug',
              urlPrefix: '',
              enableAdvancedMatching: true,
              pathPattern: '/search?category={slug}',
              matchDimension: 'pagePathPlusQueryString',
              matchType: 'EXACT',
            },
          ],
        }}
        currentEditorInterface={{}}
        originalContentTypes={{}}
        originalContentTypeRules={[]}
        showPatternValidation={false}
      />
    );

    expect(
      await screen.findByText(
        'Trailing slash applies to standard configurations only. Advanced patterns are used exactly as written.'
      )
    ).toBeVisible();
    expect(screen.getByLabelText('Append a trailing slash to all page paths')).toBeEnabled();
    expect(screen.getByLabelText('Append a trailing slash to all page paths')).toBeChecked();
  });
});
