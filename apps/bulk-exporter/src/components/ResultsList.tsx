import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Table,
  Card,
  Text,
  Badge,
  Button,
  Spinner,
  Checkbox,
  Tooltip,
  Flex,
  TextLink,
  Subheading,
  Pagination,
  Modal,
  FormControl,
  Select,
  TextInput,
  IconButton,
  Heading,
} from '@contentful/f36-components';
import {
  ArrowSquareOutIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  XIcon,
} from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import type { ContentType } from '../lib/flatten';

type SortColumn = 'name' | 'contentType' | 'updated' | 'updatedBy' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortableHeaderProps {
  column: SortColumn;
  label: string;
  activeColumn: SortColumn | null;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
}

function SortableHeader({ column, label, activeColumn, direction, onSort }: SortableHeaderProps) {
  const isActive = activeColumn === column;
  const Icon = isActive && direction === 'desc' ? SortDescendingIcon : SortAscendingIcon;
  return (
    <Tooltip
      content={
        isActive
          ? `Sorted by ${label} (${
              direction === 'asc' ? 'ascending' : 'descending'
            }) — applies to your next export. Click to flip direction.`
          : `Sort by ${label}. Applies to the next export too.`
      }
      placement="top">
      <Flex
        alignItems="center"
        gap="spacing2Xs"
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          padding: '2px 6px',
          borderRadius: '3px',
          backgroundColor: isActive ? 'var(--blue-100, rgba(13, 102, 208, 0.08))' : 'transparent',
          transition: 'background-color 120ms ease',
        }}
        onClick={() => onSort(column)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSort(column);
          }
        }}>
        <span
          style={{
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--blue-600)' : 'inherit',
          }}>
          {label}
        </span>
        <Icon
          size="tiny"
          style={{
            opacity: isActive ? 1 : 0.4,
            color: isActive ? 'var(--blue-600)' : tokens.gray700,
          }}
        />
      </Flex>
    </Tooltip>
  );
}

interface SearchResult {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    archivedAt?: string;
    publishedVersion?: number;
    version?: number;
    createdBy?: {
      sys: {
        id: string;
        linkType: string;
      };
    };
    updatedBy?: {
      sys: {
        id: string;
        linkType: string;
      };
    };
  };
  fields?: Record<string, Record<string, unknown>>;
  metadata?: {
    tags?: Array<{ sys: { id: string } }>;
  };
}

interface ContentTypeMap {
  [key: string]: {
    name: string;
    displayField?: string;
  };
}

interface UserMap {
  [key: string]: string;
}

export interface ResultsListProps {
  results: SearchResult[];
  loading: boolean;
  onPageChange?: (page: number) => void;
  activePage?: number;
  itemsPerPage?: number;
  totalCount?: number;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onExportSelected?: (
    selectedIds: string[],
    format: 'csv' | 'json' | 'xlsx' | 'xml' | 'yaml',
    filename: string
  ) => void;
  /** True once the user has clicked "Select all N entries matching this search" */
  selectAllMatching?: boolean;
  onSelectAllMatchingChange?: (value: boolean) => void;
  /** Exports every entry matching the current search filters, not just the fetched page(s) */
  onExportAllMatching?: (
    format: 'csv' | 'json' | 'xlsx' | 'xml' | 'yaml',
    filename: string
  ) => void;
  contentTypeMap?: ContentTypeMap;
  userMap?: UserMap;
  spaceId?: string;
  environmentId?: string;
  isExporting?: boolean;
  exportProgress?: { fetched: number; total: number; message?: string } | null;
  onSortChange?: (sort: { column: SortColumn; direction: SortDirection } | null) => void;
  /** Full content type schema — enables dynamic field columns in the preview */
  contentTypeSchema?: ContentType | null;
  /** Ordered field IDs selected in the Output tab */
  selectedFields?: string[];
  /** Locales selected in the Output tab — one preview column per field×locale */
  locales?: string[];
}

// ─── Styling (mirrors Bulk Edit) ────────────────────────────────────────────

// Fixed column widths — tableLayout: fixed makes these exact, so sticky left
// values are reliable pixel offsets
const COL_CHECKBOX = 48;
const COL_NAME = 260;
const COL_STATUS = 120;
const COL_FIELD = 180;

const LEFT_CHECKBOX = 0;
const LEFT_NAME = COL_CHECKBOX;
const LEFT_STATUS = COL_CHECKBOX + COL_NAME;

const stickyBase = {
  position: 'sticky' as const,
  zIndex: 1,
};

// Header sticky cells get zIndex 2 so they sit above body sticky cells
const stickyHeaderCell = (left: number, extraStyle: Record<string, unknown> = {}) => ({
  ...stickyBase,
  left,
  zIndex: 2,
  background: '#F7F9FA',
  boxShadow: 'inset 0 0 0 9999px #F7F9FA',
  ...extraStyle,
});

const stickyBodyCell = (left: number, extraStyle: Record<string, unknown> = {}) => ({
  ...stickyBase,
  left,
  background: '#fff',
  // box-shadow inset trick: fills cell with opaque color regardless of
  // Forma 36 row hover/stripe styles that would otherwise bleed through
  boxShadow: 'inset 0 0 0 9999px #fff',
  ...extraStyle,
});

const fieldHeaderCellStyle = {
  background: '#F7F9FA',
  borderRight: '1px solid #E7EBEE',
  minWidth: COL_FIELD,
  verticalAlign: 'top' as const,
  padding: '8px 12px',
};

const fieldBodyCellStyle = {
  borderRight: '1px solid #E7EBEE',
  minWidth: COL_FIELD,
  verticalAlign: 'middle' as const,
};

const fixedHeaderCellStyle = {
  background: '#F7F9FA',
};

// ─── Field type label (mirrors Bulk Edit's getFieldTypeLabel) ────────────────

type SchemaField = ContentType['fields'][number];

function getFieldTypeLabel(field: SchemaField): string {
  if (field.type === 'Link') {
    return field.linkType === 'Asset' ? 'Asset' : 'Reference';
  }
  if (field.type === 'Array') {
    if (field.items?.linkType === 'Entry') return 'Multi-reference';
    if (field.items?.linkType === 'Asset') return 'Multi-asset';
    return 'List';
  }
  const labels: Record<string, string> = {
    Symbol: 'Short text',
    Text: 'Long text',
    Integer: 'Integer',
    Number: 'Number',
    Date: 'Date',
    Boolean: 'Boolean',
    Object: 'JSON',
    RichText: 'Rich text',
    Location: 'Location',
  };
  return labels[field.type] ?? field.type;
}

// ─── Field value formatter (mirrors Bulk Edit's getFieldDisplayValue) ────────

const TRUNCATE_AT = 40;

function truncate(str: string): string {
  return str.length > TRUNCATE_AT ? str.slice(0, TRUNCATE_AT) + '…' : str;
}

function formatFieldValue(field: SchemaField, rawValue: unknown): string {
  if (rawValue === null || rawValue === undefined) return '—';

  switch (field.type) {
    case 'Symbol':
    case 'Text':
      return truncate(String(rawValue));

    case 'Integer':
    case 'Number':
      return String(rawValue);

    case 'Date':
      return String(rawValue).split('T')[0];

    case 'Boolean':
      return rawValue ? 'Yes' : 'No';

    case 'Object':
      return truncate(JSON.stringify(rawValue));

    case 'Location': {
      const loc = rawValue as { lat?: number; lon?: number };
      return `Lat: ${loc.lat ?? '?'}, Lon: ${loc.lon ?? '?'}`;
    }

    case 'RichText':
      return '[Rich text]';

    case 'Link': {
      const link = rawValue as { sys?: { id: string; linkType?: string } };
      if (link?.sys?.linkType === 'Asset') return '1 asset';
      if (link?.sys?.linkType === 'Entry') return '1 reference';
      return '—';
    }

    case 'Array': {
      if (!Array.isArray(rawValue) || rawValue.length === 0) return '—';
      const first = rawValue[0] as { sys?: { linkType?: string } };
      if (first?.sys?.linkType === 'Entry') {
        return `${rawValue.length} ${rawValue.length === 1 ? 'reference' : 'references'}`;
      }
      if (first?.sys?.linkType === 'Asset') {
        return `${rawValue.length} ${rawValue.length === 1 ? 'asset' : 'assets'}`;
      }
      return truncate((rawValue as unknown[]).map(String).join(', '));
    }

    default:
      return truncate(String(rawValue));
  }
}

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'primary' | 'positive' | 'warning' | 'negative'> = {
  changed: 'primary',
  published: 'positive',
  draft: 'warning',
  archived: 'negative',
};

function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status] ?? 'secondary';
  return (
    <Badge variant={variant as 'primary' | 'positive' | 'warning' | 'negative' | 'secondary'}>
      {status}
    </Badge>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ResultsList({
  results,
  loading,
  onPageChange,
  activePage = 0,
  itemsPerPage = 50,
  totalCount,
  selectedIds = [],
  onSelectionChange,
  onExportSelected,
  selectAllMatching = false,
  onSelectAllMatchingChange,
  onExportAllMatching,
  contentTypeMap = {},
  userMap = {},
  spaceId = '',
  environmentId = 'master',
  isExporting = false,
  exportProgress = null,
  onSortChange,
  contentTypeSchema,
  selectedFields,
  locales = [],
}: ResultsListProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx' | 'xml' | 'yaml'>('csv');
  const [exportFilename, setExportFilename] = useState('');
  const wasExporting = useRef(false);

  // Close modal after export completes
  useEffect(() => {
    if (wasExporting.current && !isExporting) {
      setExportModalOpen(false);
    }
    wasExporting.current = isExporting;
  }, [isExporting]);

  // Build ordered field schema columns when a content type schema is available
  const fieldColumns = useMemo<SchemaField[]>(() => {
    if (!contentTypeSchema) return [];
    const fieldMap = new Map(contentTypeSchema.fields.map((f) => [f.id, f]));
    const orderedIds =
      selectedFields && selectedFields.length > 0
        ? selectedFields
        : contentTypeSchema.fields.map((f) => f.id);
    // Exclude any field whose ID is 'status' — publication status is already
    // shown as a dedicated sticky column, so including it again is redundant.
    return orderedIds
      .map((id) => fieldMap.get(id))
      .filter((f): f is SchemaField => f !== undefined && f.id !== 'status');
  }, [contentTypeSchema, selectedFields]);

  // Expand to one column per field × locale combination
  const displayColumns = useMemo(() => {
    if (fieldColumns.length === 0) return [];
    const activeLocales = locales.length > 0 ? locales : [''];
    return fieldColumns.flatMap((field) => activeLocales.map((locale) => ({ field, locale })));
  }, [fieldColumns, locales]);

  const hasFieldColumns = displayColumns.length > 0;

  const sortedResults = useMemo(() => {
    if (!sortColumn) return results;

    const titleOf = (entry: SearchResult): string => {
      if (!entry.fields) return entry.sys.id;
      const contentTypeId = entry.sys.contentType.sys.id;
      const displayField = contentTypeMap[contentTypeId]?.displayField;
      if (displayField && entry.fields[displayField]) {
        const firstValue = Object.values(entry.fields[displayField])[0];
        if (firstValue && typeof firstValue === 'string') return firstValue;
      }
      const titleFields = ['title', 'name', 'displayName', 'label', 'heading', 'internalName'];
      for (const field of titleFields) {
        if (entry.fields[field]) {
          const firstValue = Object.values(entry.fields[field])[0];
          if (firstValue && typeof firstValue === 'string') return firstValue;
        }
      }
      return entry.sys.id;
    };

    const contentTypeOf = (entry: SearchResult): string => {
      const id = entry.sys.contentType.sys.id;
      return contentTypeMap[id]?.name || id;
    };

    const updatedByOf = (entry: SearchResult): string => {
      const id = entry.sys.updatedBy?.sys.id;
      return id ? userMap[id] || id : 'Unknown';
    };

    const statusOf = (entry: SearchResult): string => {
      if (entry.sys.archivedAt) return 'archived';
      const hasPublished = entry.sys.publishedVersion !== undefined;
      const isChanged =
        hasPublished &&
        entry.sys.version !== undefined &&
        entry.sys.publishedVersion !== undefined &&
        entry.sys.version > entry.sys.publishedVersion + 1;
      if (!hasPublished) return 'draft';
      if (isChanged) return 'changed';
      return 'published';
    };

    const accessor = (entry: SearchResult): string => {
      switch (sortColumn) {
        case 'name':
          return titleOf(entry).toLowerCase();
        case 'contentType':
          return contentTypeOf(entry).toLowerCase();
        case 'updated':
          return entry.sys.updatedAt;
        case 'updatedBy':
          return updatedByOf(entry).toLowerCase();
        case 'status':
          return statusOf(entry);
      }
    };

    const sorted = [...results].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av < bv) return -1;
      if (av > bv) return 1;
      if (a.sys.updatedAt !== b.sys.updatedAt) {
        return a.sys.updatedAt < b.sys.updatedAt ? 1 : -1;
      }
      return a.sys.id.localeCompare(b.sys.id);
    });

    return sortDirection === 'desc' ? sorted.reverse() : sorted;
  }, [results, sortColumn, sortDirection, contentTypeMap, userMap]);

  const handleSortClick = (column: SortColumn) => {
    if (sortColumn === column) {
      const nextDir: SortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(nextDir);
      onSortChange?.({ column, direction: nextDir });
    } else {
      setSortColumn(column);
      setSortDirection('asc');
      onSortChange?.({ column, direction: 'asc' });
    }
  };

  const sortColumnLabels: Record<SortColumn, string> = {
    name: 'Name',
    contentType: 'Content Type',
    updated: 'Updated',
    updatedBy: 'Last Updated By',
    status: 'Status',
  };

  if (loading && results.length === 0) {
    return (
      <Card padding="large">
        <Flex alignItems="center" gap="spacingS">
          <Spinner />
          <Text>Loading results...</Text>
        </Flex>
      </Card>
    );
  }

  if (results.length === 0) {
    return null;
  }

  const allCurrentIds = results.map((r) => r.sys.id);
  const allSelected =
    allCurrentIds.length > 0 && allCurrentIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectAllMatching) {
      // Unchecking while every matching entry is selected drops back to no selection.
      onSelectAllMatchingChange?.(false);
      onSelectionChange([]);
      return;
    }
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !allCurrentIds.includes(id)));
    } else {
      const newSelection = [...new Set([...selectedIds, ...allCurrentIds])];
      onSelectionChange(newSelection);
    }
  };

  const handleSelectOne = (id: string) => {
    if (!onSelectionChange) return;
    if (selectAllMatching) {
      // Deselecting a single row while every matching entry is selected falls back
      // to page-level selection (minus that row) rather than tracking exclusions.
      onSelectAllMatchingChange?.(false);
      onSelectionChange(allCurrentIds.filter((currentId) => currentId !== id));
      return;
    }
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleClearSelection = () => {
    onSelectAllMatchingChange?.(false);
    onSelectionChange?.([]);
  };

  const showSelectAllBanner =
    !selectAllMatching &&
    allSelected &&
    totalCount !== undefined &&
    totalCount > allCurrentIds.length;

  const getTitle = (entry: SearchResult): string => {
    if (!entry.fields) return entry.sys.id;
    const contentTypeId = entry.sys.contentType.sys.id;
    const displayField = contentTypeMap[contentTypeId]?.displayField;
    if (displayField && entry.fields[displayField]) {
      const firstValue = Object.values(entry.fields[displayField])[0];
      if (firstValue && typeof firstValue === 'string') return firstValue;
    }
    const titleFields = ['title', 'name', 'displayName', 'label', 'heading', 'internalName'];
    for (const field of titleFields) {
      if (entry.fields[field]) {
        const firstValue = Object.values(entry.fields[field])[0];
        if (firstValue && typeof firstValue === 'string') return firstValue;
      }
    }
    return entry.sys.id;
  };

  const getStatus = (entry: SearchResult): string => {
    if (entry.sys.archivedAt) return 'archived';
    const hasPublished = entry.sys.publishedVersion !== undefined;
    const isChanged =
      hasPublished &&
      entry.sys.version !== undefined &&
      entry.sys.publishedVersion !== undefined &&
      entry.sys.version > entry.sys.publishedVersion + 1;
    if (!hasPublished) return 'draft';
    if (isChanged) return 'changed';
    return 'published';
  };

  const getFieldValue = (entry: SearchResult, field: SchemaField, locale: string): string => {
    if (!entry.fields?.[field.id]) return '—';
    const localeMap = entry.fields[field.id];
    const value = locale
      ? (localeMap[locale] ?? Object.values(localeMap)[0])
      : Object.values(localeMap)[0];
    return formatFieldValue(field, value);
  };

  const getContentTypeName = (entry: SearchResult): string => {
    const contentTypeId = entry.sys.contentType.sys.id;
    return contentTypeMap[contentTypeId]?.name || contentTypeId;
  };

  const getLastUpdatedBy = (entry: SearchResult): string => {
    if (entry.sys.updatedBy?.sys.id) {
      return userMap[entry.sys.updatedBy.sys.id] || entry.sys.updatedBy.sys.id;
    }
    return 'Unknown';
  };

  const formatDate = (dateString: string): string =>
    new Date(dateString).toISOString().split('T')[0];

  return (
    <Card data-results-list style={{ overflow: 'hidden', padding: 0 }}>
      <Flex flexDirection="column">
        {/* Header */}
        <Flex
          justifyContent="space-between"
          alignItems="flex-start"
          style={{ padding: '20px 24px 16px' }}>
          <Flex flexDirection="column" gap="spacing2Xs">
            <Subheading marginBottom="none">Search results</Subheading>
            <Flex gap="spacingS" alignItems="center">
              <Text fontSize="fontSizeS" fontColor="gray600">
                {totalCount !== undefined
                  ? `${totalCount.toLocaleString()} results`
                  : `${results.length} results`}
              </Text>
              {sortColumn && (
                <Tooltip
                  content="This sort applies to your next export — the file rows will match the order shown below"
                  placement="top">
                  <Badge variant="secondary">
                    Sorted by {sortColumnLabels[sortColumn]} (
                    {sortDirection === 'asc' ? 'A→Z' : 'Z→A'})
                  </Badge>
                </Tooltip>
              )}
            </Flex>
          </Flex>
        </Flex>

        {/* Selection bar */}
        {(selectedIds.length > 0 || selectAllMatching) && (
          <div style={{ padding: '0 24px' }}>
            <Flex
              alignItems="center"
              gap="spacingS"
              flexWrap="wrap"
              style={{
                padding: '12px 0',
                borderTop: `1px solid ${tokens.gray200}`,
                borderBottom: `1px solid ${tokens.gray200}`,
              }}>
              <Text fontSize="fontSizeM" fontColor="gray700">
                {selectAllMatching ? (
                  <>
                    All {(totalCount ?? selectedIds.length).toLocaleString()}{' '}
                    {(totalCount ?? selectedIds.length) === 1 ? 'entry' : 'entries'} matching this
                    search are selected.{' '}
                    <TextLink as="button" onClick={handleClearSelection}>
                      Clear selection
                    </TextLink>
                  </>
                ) : showSelectAllBanner ? (
                  <>
                    All {allCurrentIds.length} {allCurrentIds.length === 1 ? 'entry' : 'entries'} on
                    this page are selected.{' '}
                    <TextLink as="button" onClick={() => onSelectAllMatchingChange?.(true)}>
                      Select all {totalCount?.toLocaleString()} entries matching this search
                    </TextLink>
                  </>
                ) : (
                  `${selectedIds.length} ${selectedIds.length === 1 ? 'entry' : 'entries'} selected:`
                )}
              </Text>
              {onExportSelected && (
                <Button
                  size="small"
                  variant="primary"
                  onClick={() => setExportModalOpen(true)}
                  isDisabled={isExporting}>
                  Export
                </Button>
              )}
            </Flex>
          </div>
        )}

        {/* Table — horizontal scroll when field columns overflow.
            tableLayout: fixed lets us set exact column widths so sticky
            left offsets are reliable pixel values. */}
        <div
          style={{
            padding: `${selectedIds.length > 0 || selectAllMatching ? '24px' : '0'} 24px 24px`,
          }}>
          <div style={{ border: '1px solid #E7EBEE', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <Table
                style={{
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  tableLayout: 'fixed',
                  width: '100%',
                }}>
                <colgroup>
                  <col style={{ width: COL_CHECKBOX }} />
                  <col style={{ width: COL_NAME }} />
                  <col style={{ width: COL_STATUS }} />
                  {hasFieldColumns ? (
                    displayColumns.map(({ field, locale }) => (
                      <col key={`${field.id}-${locale}`} style={{ width: COL_FIELD }} />
                    ))
                  ) : (
                    <>
                      <col style={{ width: COL_FIELD }} />
                      <col style={{ width: COL_FIELD }} />
                      <col style={{ width: COL_FIELD }} />
                    </>
                  )}
                </colgroup>
                <Table.Head>
                  <Table.Row>
                    {/* Checkbox — sticky */}
                    <Table.Cell
                      as="th"
                      style={{
                        ...stickyHeaderCell(LEFT_CHECKBOX),
                        borderRight: '1px solid #E7EBEE',
                      }}>
                      {onSelectionChange && (
                        <Checkbox
                          isChecked={allSelected || selectAllMatching}
                          isIndeterminate={someSelected && !selectAllMatching}
                          onChange={handleSelectAll}
                          aria-label="Select all entries on this page"
                        />
                      )}
                    </Table.Cell>

                    {/* Name — sticky */}
                    <Table.Cell
                      as="th"
                      style={{
                        ...stickyHeaderCell(LEFT_NAME),
                        minWidth: COL_NAME,
                        borderRight: '1px solid #E7EBEE',
                      }}>
                      <SortableHeader
                        column="name"
                        label="Display name"
                        activeColumn={sortColumn}
                        direction={sortDirection}
                        onSort={handleSortClick}
                      />
                    </Table.Cell>

                    {/* Status — sticky, with shadow on right edge to separate sticky from scrolling */}
                    <Table.Cell
                      as="th"
                      style={{
                        ...stickyHeaderCell(LEFT_STATUS),
                        minWidth: COL_STATUS,
                        borderRight: '2px solid #CFD9E0',
                        padding: '8px 12px',
                      }}>
                      <Text fontWeight="fontWeightMedium" fontSize="fontSizeS" fontColor="gray900">
                        Status
                      </Text>
                    </Table.Cell>

                    {hasFieldColumns ? (
                      /* Dynamic field columns — one per field × locale */
                      displayColumns.map(({ field, locale }) => (
                        <Table.Cell
                          as="th"
                          key={`${field.id}-${locale}`}
                          style={fieldHeaderCellStyle}>
                          <Flex flexDirection="column" gap="spacing2Xs">
                            <Text
                              fontWeight="fontWeightMedium"
                              fontSize="fontSizeS"
                              fontColor="gray900">
                              {locales.length > 1 ? `(${locale}) ${field.name}` : field.name}
                            </Text>
                            <Text
                              fontSize="fontSizeS"
                              fontColor="gray600"
                              style={{ fontSize: '11px' }}>
                              {getFieldTypeLabel(field)}
                            </Text>
                          </Flex>
                        </Table.Cell>
                      ))
                    ) : (
                      /* Default metadata columns when no content type selected */
                      <>
                        <Table.Cell as="th" style={fixedHeaderCellStyle}>
                          <SortableHeader
                            column="contentType"
                            label="Content Type"
                            activeColumn={sortColumn}
                            direction={sortDirection}
                            onSort={handleSortClick}
                          />
                        </Table.Cell>
                        <Table.Cell as="th" style={fixedHeaderCellStyle}>
                          <SortableHeader
                            column="updated"
                            label="Updated"
                            activeColumn={sortColumn}
                            direction={sortDirection}
                            onSort={handleSortClick}
                          />
                        </Table.Cell>
                        <Table.Cell as="th" style={fixedHeaderCellStyle}>
                          <SortableHeader
                            column="updatedBy"
                            label="Last updated by"
                            activeColumn={sortColumn}
                            direction={sortDirection}
                            onSort={handleSortClick}
                          />
                        </Table.Cell>
                      </>
                    )}
                  </Table.Row>
                </Table.Head>

                <Table.Body>
                  {sortedResults.map((entry) => {
                    const status = getStatus(entry);
                    const entryUrl = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entry.sys.id}`;
                    return (
                      <Table.Row key={entry.sys.id}>
                        {/* Checkbox — sticky */}
                        <Table.Cell
                          style={{
                            ...stickyBodyCell(LEFT_CHECKBOX),
                            borderRight: '1px solid #E7EBEE',
                          }}>
                          {onSelectionChange && (
                            <Checkbox
                              isChecked={selectedIds.includes(entry.sys.id)}
                              onChange={() => handleSelectOne(entry.sys.id)}
                              aria-label={`Select ${getTitle(entry)}`}
                            />
                          )}
                        </Table.Cell>

                        {/* Display name — sticky, TextLink like Bulk Edit */}
                        <Table.Cell
                          style={{
                            ...stickyBodyCell(LEFT_NAME),
                            minWidth: COL_NAME,
                            borderRight: '1px solid #E7EBEE',
                          }}>
                          <TextLink
                            href={entryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            icon={<ArrowSquareOutIcon />}
                            alignIcon="end"
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                            {getTitle(entry)}
                          </TextLink>
                        </Table.Cell>

                        {/* Status badge — sticky */}
                        <Table.Cell
                          style={{
                            ...stickyBodyCell(LEFT_STATUS),
                            minWidth: COL_STATUS,
                            borderRight: '2px solid #CFD9E0',
                          }}>
                          <StatusBadge status={status} />
                        </Table.Cell>

                        {hasFieldColumns ? (
                          /* Field value cells — one per field × locale */
                          displayColumns.map(({ field, locale }) => (
                            <Table.Cell key={`${field.id}-${locale}`} style={fieldBodyCellStyle}>
                              <Text fontSize="fontSizeS" fontColor="gray700">
                                {getFieldValue(entry, field, locale)}
                              </Text>
                            </Table.Cell>
                          ))
                        ) : (
                          /* Default metadata cells */
                          <>
                            <Table.Cell>
                              <Text fontSize="fontSizeS">{getContentTypeName(entry)}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="fontSizeS">{formatDate(entry.sys.updatedAt)}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text fontSize="fontSizeS">{getLastUpdatedBy(entry)}</Text>
                            </Table.Cell>
                          </>
                        )}
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </div>
          </div>
        </div>

        {totalCount !== undefined && totalCount > itemsPerPage && (
          <Flex justifyContent="center" padding="spacingM">
            <Pagination
              activePage={activePage}
              onPageChange={(page) => onPageChange?.(page)}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
            />
          </Flex>
        )}
      </Flex>

      <Modal
        isShown={exportModalOpen}
        onClose={() => {
          if (!isExporting) setExportModalOpen(false);
        }}
        size="medium">
        <Modal.Content style={{ padding: 0 }}>
          {/* Header */}
          <Flex
            justifyContent="space-between"
            alignItems="center"
            style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${tokens.gray200}`,
            }}>
            <Heading as="h2" marginBottom="none">
              File export
            </Heading>
            {!isExporting && (
              <IconButton
                variant="transparent"
                icon={<XIcon />}
                aria-label="Close"
                size="small"
                onClick={() => setExportModalOpen(false)}
              />
            )}
          </Flex>

          {/* Fields or progress */}
          <div style={{ padding: '16px 24px 0' }}>
            {isExporting ? (
              <Text>
                {exportProgress?.message ||
                  (selectAllMatching
                    ? `Exporting ${(totalCount ?? 0).toLocaleString()} matching entries`
                    : `Exporting ${selectedIds.length} selected entries`)}
              </Text>
            ) : (
              <>
                <FormControl marginBottom="spacingL">
                  <FormControl.Label>File type</FormControl.Label>
                  <Select
                    value={exportFormat}
                    onChange={(e) =>
                      setExportFormat(e.target.value as 'csv' | 'json' | 'xlsx' | 'xml' | 'yaml')
                    }>
                    <Select.Option value="csv">CSV</Select.Option>
                    <Select.Option value="json">JSON</Select.Option>
                    <Select.Option value="xlsx">Excel (XLSX)</Select.Option>
                    <Select.Option value="xml">XML</Select.Option>
                    <Select.Option value="yaml">YAML</Select.Option>
                  </Select>
                </FormControl>
                <FormControl marginBottom="none">
                  <FormControl.Label>File name</FormControl.Label>
                  <TextInput
                    value={exportFilename}
                    onChange={(e) => setExportFilename(e.target.value)}
                    placeholder=""
                  />
                </FormControl>
              </>
            )}
          </div>

          {/* Controls */}
          <Flex justifyContent="flex-end" gap="spacingS" style={{ padding: '16px 24px' }}>
            {!isExporting && (
              <Button variant="secondary" size="small" onClick={() => setExportModalOpen(false)}>
                Cancel
              </Button>
            )}
            <Button
              variant="positive"
              size="small"
              isLoading={isExporting}
              isDisabled={isExporting}
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                if (selectAllMatching) {
                  const resolvedFilename = exportFilename.trim() || `all-matching-${today}`;
                  onExportAllMatching?.(exportFormat, resolvedFilename);
                  return;
                }
                const resolvedFilename =
                  exportFilename.trim() || `selected-${selectedIds.length}-entries-${today}`;
                onExportSelected?.(selectedIds, exportFormat, resolvedFilename);
              }}>
              {isExporting ? 'Exporting' : 'Export'}
            </Button>
          </Flex>
        </Modal.Content>
      </Modal>
    </Card>
  );
}
