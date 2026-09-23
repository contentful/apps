import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ExportForm } from '../ExportForm';

const baseProps = {
  contentTypes: [],
  availableLocales: [{ code: 'en-US', name: 'English (US)' }],
  availableTags: [],
  onSubmit: vi.fn(),
  onEstimate: vi.fn(),
  onSearch: vi.fn(),
  isExporting: false,
  isSearching: false,
  estimatedCount: null,
  spaceId: 'space1',
  organizationId: 'org1',
};

const availableConcepts = [
  { sys: { id: 'concept-marketing' }, prefLabel: { 'en-US': 'Marketing' } },
  { sys: { id: 'concept-engineering' }, prefLabel: { 'en-US': 'Engineering' } },
];

// The concept Multiselect's dropdown content is only interactive once open
// (it's mounted with display:none until then), so every test opens it first.
async function openConceptDropdown(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByText('Select or paste an ID').closest('button');
  if (!trigger) throw new Error('Could not find the taxonomy concepts trigger button');
  await user.click(trigger);
  return screen.getByPlaceholderText('Search or paste a concept ID');
}

// f36 components use the `data-test-id` attribute (not RTL's default
// `data-testid`), and the option label is split across a highlighted <span>,
// so we match on the item's container via a raw attribute selector.
function queryConceptOption(id: string) {
  return document.querySelector(`[data-test-id="cf-multiselect-list-item-${id}"]`);
}

describe('ExportForm taxonomy concept filter', () => {
  it('offers to add a manually entered ID that is not in the discovered list', async () => {
    const user = userEvent.setup();
    render(<ExportForm {...baseProps} availableConcepts={availableConcepts} />);

    const search = await openConceptDropdown(user);
    await user.type(search, 'concept-legal');

    expect(queryConceptOption('concept-legal')).toHaveTextContent(
      'Add "concept-legal" as concept ID'
    );
  });

  it('does not offer to add an ID that already exists in the discovered list', async () => {
    const user = userEvent.setup();
    render(<ExportForm {...baseProps} availableConcepts={availableConcepts} />);

    const search = await openConceptDropdown(user);
    await user.type(search, 'concept-marketing');

    expect(queryConceptOption('concept-marketing')).not.toHaveTextContent('Add ');
  });

  it('filters the concept options to those matching the search term by id or label', async () => {
    const user = userEvent.setup();
    render(<ExportForm {...baseProps} availableConcepts={availableConcepts} />);

    const search = await openConceptDropdown(user);
    await user.type(search, 'Engineering');

    expect(queryConceptOption('concept-engineering')).toBeInTheDocument();
    expect(queryConceptOption('concept-marketing')).not.toBeInTheDocument();
  });

  it('adds a manually entered concept ID and stops offering to re-add it', async () => {
    const user = userEvent.setup();
    render(<ExportForm {...baseProps} availableConcepts={availableConcepts} />);

    const search = await openConceptDropdown(user);
    await user.type(search, 'concept-legal');
    await user.click(queryConceptOption('concept-legal')!);

    // The newly added concept now shows up as a normal (checked) option
    // instead of an "Add" prompt when searched for again.
    await user.clear(search);
    await user.type(search, 'concept-legal');
    expect(queryConceptOption('concept-legal')).toHaveTextContent('concept-legal');
    expect(queryConceptOption('concept-legal')).not.toHaveTextContent('Add ');
  });
});
