import { Badge, Checkbox, Table, Text, TextLink } from '@contentful/f36-components';
import { OrphanResult } from '../types';

interface OrphanTableProps {
  /** The rows to render — with pagination, just the current page. */
  results: OrphanResult[];
  /**
   * Selectable results across every page, not just the rendered slice.
   * Pagination is navigation, not a view-narrowing filter, so the header
   * checkbox reflects (and select-all acts on) the whole set — the count
   * line and the archive confirmation spell out what is selected.
   */
  totalResultCount: number;
  selectedIds: string[];
  onToggleResult: (resultId: string) => void;
  onToggleAll: () => void;
  onOpenResult: (result: OrphanResult) => void;
  /** Disables selection while an archive operation is running. */
  isDisabled: boolean;
}

const formatDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const OrphanTable = ({
  results,
  totalResultCount,
  selectedIds,
  onToggleResult,
  onToggleAll,
  onOpenResult,
  isDisabled,
}: OrphanTableProps) => {
  const allSelected = totalResultCount > 0 && selectedIds.length === totalResultCount;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <Table testId="orphan-table">
      <Table.Head>
        <Table.Row>
          <Table.Cell width="40px">
            <Checkbox
              testId="select-all"
              aria-label="Select all results across all pages"
              isChecked={allSelected}
              isIndeterminate={someSelected}
              isDisabled={isDisabled || totalResultCount === 0}
              onChange={onToggleAll}
            />
          </Table.Cell>
          <Table.Cell>Title</Table.Cell>
          <Table.Cell>Type</Table.Cell>
          <Table.Cell>Status</Table.Cell>
          {/* Creation info, not last-updated: orphans were (by default)
              never edited after creation, so created when/by whom is what
              identifies the mistake and its source. */}
          <Table.Cell>Created</Table.Cell>
          <Table.Cell>Created by</Table.Cell>
          <Table.Cell width="80px"></Table.Cell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {results.map((result) => (
          <Table.Row key={result.id} testId={`orphan-row-${result.id}`}>
            <Table.Cell>
              <Checkbox
                testId={`select-${result.id}`}
                // Every listed item is untitled by definition, so the sys id
                // is the only unique handle for assistive technology.
                aria-label={`Select ${result.kind} ${result.id}`}
                isChecked={selectedIds.includes(result.id)}
                isDisabled={isDisabled}
                onChange={() => onToggleResult(result.id)}
              />
            </Table.Cell>
            <Table.Cell>
              {/* Untitled-scan results never have a title; unreferenced ones
                  usually do. The gray "Untitled" placeholder mirrors what
                  the content list and media library show for titleless items. */}
              {result.title !== undefined ? (
                <Text>{result.title}</Text>
              ) : (
                <Text fontColor="gray600">Untitled</Text>
              )}
            </Table.Cell>
            <Table.Cell>{result.typeName}</Table.Cell>
            <Table.Cell>
              <Badge variant="warning">Draft</Badge>
            </Table.Cell>
            <Table.Cell>{formatDate(result.createdAt)}</Table.Cell>
            <Table.Cell>{result.createdBy}</Table.Cell>
            <Table.Cell>
              {/* Previewing is an explicit action instead of a click on the
                  title, so selecting rows never accidentally triggers the
                  slide-in. "Preview" signals it is a slide-in, not a page
                  change. */}
              <TextLink as="button" onClick={() => onOpenResult(result)}>
                Preview
              </TextLink>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};
