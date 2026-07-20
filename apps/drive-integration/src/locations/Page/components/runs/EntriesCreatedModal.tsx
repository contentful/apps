import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Flex,
  Modal,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Text,
  TextLink,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';

interface EntryRow {
  id: string;
  title: string;
  contentTypeName: string;
  status: 'Draft' | 'Published' | 'Changed';
}

interface EntriesCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  sdk: PageAppSDK;
  spaceId: string;
  webappHost: string;
  entryIds: string[];
}

async function fetchEntryRows(
  sdk: PageAppSDK,
  spaceId: string,
  entryIds: string[]
): Promise<EntryRow[]> {
  const environmentId = sdk.ids.environmentAlias ?? sdk.ids.environment;

  const entries = await Promise.all(
    entryIds.map((id) =>
      sdk.cma.entry.get({ entryId: id, spaceId, environmentId }).catch(() => null)
    )
  );

  const contentTypeIds = [
    ...new Set(entries.filter(Boolean).map((e) => e!.sys.contentType.sys.id)),
  ];
  const contentTypes = await Promise.all(
    contentTypeIds.map((ctId) =>
      sdk.cma.contentType.get({ contentTypeId: ctId, spaceId, environmentId }).catch(() => null)
    )
  );
  const ctMap = new Map(contentTypes.filter(Boolean).map((ct) => [ct!.sys.id, ct!]));

  return entries
    .map((entry, i) => {
      if (!entry) return null;
      const ct = ctMap.get(entry.sys.contentType.sys.id);
      const displayField = ct?.displayField;
      const locale = sdk.locales.default;
      const title =
        (displayField && String(entry.fields[displayField]?.[locale] ?? '')) || 'Untitled';
      const contentTypeName = ct?.name ?? entry.sys.contentType.sys.id;

      const isPublished = !!entry.sys.publishedAt;
      const isDraft = !isPublished;
      const isChanged = isPublished && entry.sys.version > (entry.sys.publishedVersion ?? 0) + 1;
      const status: EntryRow['status'] = isChanged ? 'Changed' : isDraft ? 'Draft' : 'Published';

      return { id: entryIds[i], title, contentTypeName, status };
    })
    .filter((r): r is EntryRow => r !== null);
}

const STATUS_STYLES: Record<EntryRow['status'], React.CSSProperties> = {
  Draft: { background: '#FEF3C7', color: '#92400E', border: 'none' },
  Published: { background: '#D1FAE5', color: '#065F46', border: 'none' },
  Changed: { background: '#DBEAFE', color: '#1E40AF', border: 'none' },
};

export function EntriesCreatedModal({
  isOpen,
  onClose,
  sdk,
  spaceId,
  webappHost,
  entryIds,
}: EntriesCreatedModalProps) {
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || entryIds.length === 0) return;
    setIsLoading(true);
    fetchEntryRows(sdk, spaceId, entryIds)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setIsLoading(false));
  }, [isOpen, entryIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal isShown={isOpen} onClose={onClose} size="large">
      {() => (
        <>
          <Modal.Header title="Entries created" onClose={onClose} />
          <Modal.Content>
            {isLoading ? (
              <Flex justifyContent="center" padding="spacingL">
                <Spinner size="large" />
              </Flex>
            ) : (
              <Table>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <TextLink
                          href={`https://${webappHost}/spaces/${spaceId}/entries/${row.id}`}
                          target="_blank"
                          rel="noopener noreferrer">
                          <Text fontWeight="fontWeightMedium">{row.title}</Text>
                        </TextLink>
                      </TableCell>
                      <TableCell style={{ width: '140px', verticalAlign: 'middle' }}>
                        <Badge variant="secondary" style={STATUS_STYLES[row.status]}>
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Modal.Content>
          <Modal.Controls>
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}
