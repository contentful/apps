import { Badge, Checkbox, Table, Text, TextLink } from '@contentful/f36-components';
import { OrphanResult } from '../types';

interface OrphanTableProps {
  results: OrphanResult[];
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
  selectedIds,
  onToggleResult,
  onToggleAll,
  onOpenResult,
  isDisabled,
}: OrphanTableProps) => {
  const allSelected = results.length > 0 && selectedIds.length === results.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <Table testId="orphan-table">
      <Table.Head>
        <Table.Row>
          <Table.Cell width="40px">
            <Checkbox
              testId="select-all"
              aria-label="Select all results"
              isChecked={allSelected}
              isIndeterminate={someSelected}
              isDisabled={isDisabled || results.length === 0}
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
              {/* The scan only lists items with an empty title, so this is
                  always the editor's "Untitled" placeholder, mirroring what
                  the content list and media library show for them. */}
              <Text fontColor="gray600">Untitled</Text>
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
