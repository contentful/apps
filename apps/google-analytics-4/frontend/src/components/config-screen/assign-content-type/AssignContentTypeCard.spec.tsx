import { render, screen } from '@testing-library/react';
import { AllContentTypes, AllContentTypeEntries, ContentTypeRules } from '../../../types';
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

const contentTypeRules: ContentTypeRules = [
  {
    id: 'rule-course',
    contentTypeId: 'course',
    slugField: 'slug',
    urlPrefix: '/about',
    enableAdvancedMatching: false,
    matchDimension: 'unifiedPagePathScreen',
    matchType: 'EXACT',
  },
];

describe('Assign Content Type Card for Config Screen', () => {
  it('can render the field labels when there is a saved content type entry', () => {
    render(
      <AssignContentTypeCard
        allContentTypes={allContentTypes}
        allContentTypeEntries={allContentTypeEntries}
        contentTypeRules={contentTypeRules}
        onContentTypeChange={() => {}}
        onContentTypeFieldChange={() => {}}
        onContentTypeRuleChange={() => {}}
        onRemoveContentType={() => {}}
        currentEditorInterface={{}}
        originalContentTypeRules={[]}
        rulesMissingPattern={new Set()}
        rulesWithUnknownPatternTokens={new Map()}
        duplicateRuleIds={new Set()}
        showPatternValidation={false}
      />
    );

    expect(screen.getByText('Content type')).toBeVisible();
    expect(screen.getByText('Slug field')).toBeVisible();
    expect(screen.getByText('URL prefix')).toBeVisible();
    expect(screen.queryByText('Path pattern')).not.toBeInTheDocument();
  });

  it('can render the correct number of saved content types', () => {
    render(
      <AssignContentTypeCard
        allContentTypes={allContentTypes}
        allContentTypeEntries={allContentTypeEntries}
        contentTypeRules={contentTypeRules}
        onContentTypeChange={() => {}}
        onContentTypeFieldChange={() => {}}
        onContentTypeRuleChange={() => {}}
        onRemoveContentType={() => {}}
        currentEditorInterface={{}}
        originalContentTypeRules={[]}
        rulesMissingPattern={new Set()}
        rulesWithUnknownPatternTokens={new Map()}
        duplicateRuleIds={new Set()}
        showPatternValidation={false}
      />
    );

    expect(screen.getAllByTestId('contentTypeRow').length).toBe(1);
  });

  it('explains that the selected slug field provides the value for {slug}', async () => {
    render(
      <AssignContentTypeCard
        allContentTypes={allContentTypes}
        allContentTypeEntries={allContentTypeEntries}
        contentTypeRules={contentTypeRules}
        onContentTypeChange={() => {}}
        onContentTypeFieldChange={() => {}}
        onContentTypeRuleChange={() => {}}
        onRemoveContentType={() => {}}
        currentEditorInterface={{}}
        originalContentTypeRules={[]}
        rulesMissingPattern={new Set()}
        rulesWithUnknownPatternTokens={new Map()}
        duplicateRuleIds={new Set()}
        showPatternValidation={false}
      />
    );

    expect(screen.getByText('Slug field')).toBeVisible();
  });
});
