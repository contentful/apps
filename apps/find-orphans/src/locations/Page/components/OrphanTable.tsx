import { Badge, Checkbox, Table, Text, TextLink } from '@contentful/f36-components';
import { OrphanResult } from '../types';

interface OrphanTableProps {
  results: OrphanResult[];
  selectedIds: string[];
  onToggleEntry: (entryId: string) => void;
  onToggleAll: () => void;
  onOpenEntry: (entryId: string) => void;
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
  onToggleEntry,
  onToggleAll,
  onOpenEntry,
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
              aria-label="Select all entries"
              isChecked={allSelected}
              isIndeterminate={someSelected}
              isDisabled={isDisabled || results.length === 0}
              onChange={onToggleAll}
            />
          </Table.Cell>
          <Table.Cell>Title</Table.Cell>
          <Table.Cell>Content type</Table.Cell>
          <Table.Cell>Status</Table.Cell>
          <Table.Cell>Last updated</Table.Cell>
          <Table.Cell width="80px"></Table.Cell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {results.map(({ entry, contentType }) => (
          <Table.Row key={entry.sys.id} testId={`orphan-row-${entry.sys.id}`}>
            <Table.Cell>
              <Checkbox
                testId={`select-${entry.sys.id}`}
                // Every listed entry is untitled by definition, so the entry
                // id is the only unique handle for assistive technology.
                aria-label={`Select entry ${entry.sys.id}`}
                isChecked={selectedIds.includes(entry.sys.id)}
                isDisabled={isDisabled}
                onChange={() => onToggleEntry(entry.sys.id)}
              />
            </Table.Cell>
            <Table.Cell>
              {/* The scan only lists entries whose display field is empty,
                  so the title is always the editor's "Untitled" placeholder,
                  mirroring what the content list shows for these entries. */}
              <Text fontColor="gray600">Untitled</Text>
            </Table.Cell>
            <Table.Cell>{contentType.name}</Table.Cell>
            <Table.Cell>
              <Badge variant="warning">Draft</Badge>
            </Table.Cell>
            <Table.Cell>{formatDate(entry.sys.updatedAt)}</Table.Cell>
            <Table.Cell>
              {/* Previewing is an explicit action instead of a click on the
                  title, so selecting rows never accidentally triggers the
                  slide-in. "Preview" signals it is a slide-in, not a page
                  change. */}
              <TextLink as="button" onClick={() => onOpenEntry(entry.sys.id)}>
                Preview
              </TextLink>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};
