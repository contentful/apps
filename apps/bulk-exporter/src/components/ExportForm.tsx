import { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Datepicker,
  Flex,
  FormControl,
  IconButton,
  Multiselect,
  Select,
  Paragraph,
  Subheading,
  TextInput,
  Tooltip,
} from '@contentful/f36-components';
import {
  InfoIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashSimpleIcon,
} from '@contentful/f36-icons';
import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';
import type { ContentType } from '../lib/flatten';
import type { EntryStatus, FieldFilter } from '../lib/queryBuilder';
import type { ExportFormat } from '../lib/exportFormats';
import {
  getSpacePreferences,
  saveSpacePreferences,
} from '../lib/preferences';

export interface ExportFormData {
  contentType: ContentType | null;
  contentTypeId: string;
  locales: string[];
  fields?: string[];
  search?: string;
  status?: EntryStatus;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sort?: string;
  tags?: string[];
  tagsMatchAll?: boolean;
  concepts?: string[];
  conceptsMatchAll?: boolean;
  fieldFilters?: FieldFilter[];
  customFilename?: string;
  format?: ExportFormat;
}

export interface ExportFormProps {
  contentTypes: ContentType[];
  availableLocales: Array<{ code: string; name: string }>;
  availableTags: Array<{ sys: { id: string }; name: string }>;
  availableConcepts: Array<{ sys: { id: string }; prefLabel: Record<string, string> }>;
  onSubmit: (data: ExportFormData) => void;
  onEstimate: (data: ExportFormData) => void;
  onSearch: (data: ExportFormData) => void;
  onQuickExport?: (data: ExportFormData, format: ExportFormat) => void;
  isExporting: boolean;
  isSearching: boolean;
  estimatedCount: number | null;
  spaceId: string;
}

const styles = {
  card: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: '6px',
    backgroundColor: tokens.colorWhite,
    width: '100%',
  }),
  cardHeader: css({
    padding: `${tokens.spacingM} ${tokens.spacingL}`,
    borderBottom: `1px solid ${tokens.gray200}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  cardBody: css({
    padding: tokens.spacingL,
  }),
dateRangeCard: css({
    border: `1px solid ${tokens.gray200}`,
    borderRadius: '6px',
    backgroundColor: tokens.gray100,
    padding: tokens.spacingM,
    marginTop: tokens.spacingS,
  }),
  fieldFilterRow: css({
    border: `1px solid ${tokens.gray200}`,
    borderRadius: '6px',
    backgroundColor: tokens.gray100,
    padding: tokens.spacingS,
    marginTop: tokens.spacingXs,
  }),
};

export function ExportForm({
  contentTypes,
  availableLocales,
  availableTags,
  availableConcepts,
  onSubmit,
  onSearch,
  isExporting,
  isSearching,
  spaceId,
}: ExportFormProps) {
  const initialSpacePrefs = useMemo(() => getSpacePreferences(spaceId), [spaceId]);

const [contentTypeId, setContentTypeId] = useState('');
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EntryStatus>('any');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [updatedFrom, setUpdatedFrom] = useState('');
  const [updatedTo, setUpdatedTo] = useState('');
  const [sort] = useState('sys.createdAt');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsMatchAll] = useState(false);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [conceptsMatchAll] = useState(false);
  const [fieldFilters, setFieldFilters] = useState<FieldFilter[]>([]);
  const [format] = useState<ExportFormat>(initialSpacePrefs.format ?? 'csv');
  const [showCreatedRange, setShowCreatedRange] = useState(false);
  const [showUpdatedRange, setShowUpdatedRange] = useState(false);

  const selectedContentType = useMemo(
    () => contentTypes.find(ct => ct.sys.id === contentTypeId) || null,
    [contentTypes, contentTypeId]
  );

  useEffect(() => {
    if (!spaceId) return;
    saveSpacePreferences(spaceId, { format });
  }, [format, spaceId]);

  const handleAddFieldFilter = () => {
    setFieldFilters([...fieldFilters, { fieldId: '', operator: 'equals', value: '' }]);
  };

  const handleRemoveFieldFilter = (index: number) => {
    setFieldFilters(fieldFilters.filter((_, i) => i !== index));
  };

  const handleFieldFilterChange = (index: number, key: keyof FieldFilter, value: string) => {
    const updated = [...fieldFilters];
    updated[index] = { ...updated[index], [key]: value };
    setFieldFilters(updated);
  };

  const formData: ExportFormData = {
    contentType: selectedContentType,
    contentTypeId,
    locales: selectedLocales.length > 0 ? selectedLocales : availableLocales.map(l => l.code),
    search,
    status,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    sort,
    tags: selectedTags,
    tagsMatchAll,
    concepts: selectedConcepts,
    conceptsMatchAll,
    fieldFilters,
    format,
  };

  const handleGenerate = () => {
    onSearch(formData);
  };

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

return (
    <form onSubmit={handleExport} style={{ width: '100%' }}>
      <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Subheading marginBottom="none">Generate entry list</Subheading>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleGenerate}
                  isDisabled={isExporting || isSearching}
                  isLoading={isSearching}
                >
                  Generate list
                </Button>
              </div>

              <div className={styles.cardBody}>
                <Flex gap="spacingM" alignItems="flex-start" flexWrap="wrap">
                  {/* Content type */}
                  <FormControl style={{ width: '220px', marginBottom: 0 }}>
                    <FormControl.Label>Content type</FormControl.Label>
                    <Select
                      value={contentTypeId}
                      onChange={(e) => setContentTypeId(e.target.value)}
                      isDisabled={isExporting}
                    >
                      <Select.Option value="">All content types</Select.Option>
                      {contentTypes.map(ct => (
                        <Select.Option key={ct.sys.id} value={ct.sys.id}>
                          {ct.name || ct.sys.id}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Search entry text */}
                  <FormControl style={{ flex: '1 1 240px', marginBottom: 0 }}>
                    <FormControl.Label>Search entry text</FormControl.Label>
                    <TextInput
                      placeholder="Search"
                      icon={<MagnifyingGlassIcon />}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      isDisabled={isExporting}
                    />
                    <FormControl.HelpText>
                      Search text based fields for specific entry text
                    </FormControl.HelpText>
                  </FormControl>

                  {/* Status */}
                  <FormControl style={{ width: '140px', marginBottom: 0 }}>
                    <FormControl.Label>Status</FormControl.Label>
                    <Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as EntryStatus)}
                      isDisabled={isExporting}
                    >
                      <Select.Option value="any">Any</Select.Option>
                      <Select.Option value="published">Published</Select.Option>
                      <Select.Option value="draft">Draft</Select.Option>
                      <Select.Option value="changed">Changed</Select.Option>
                      <Select.Option value="archived">Archived</Select.Option>
                    </Select>
                  </FormControl>

                  {/* Locales */}
                  <FormControl
                    isDisabled={!selectedContentType || isExporting}
                    style={{ flex: '1 1 160px', marginBottom: 0 }}
                  >
                    <FormControl.Label>Locales</FormControl.Label>
                    <Multiselect
                      currentSelection={selectedLocales}
                      placeholder="All locales"
                      triggerButtonProps={{ isDisabled: !selectedContentType || isExporting }}
                    >
                      {availableLocales.map(l => (
                        <Multiselect.Option
                          key={l.code}
                          itemId={l.code}
                          value={l.code}
                          label={l.name}
                          onSelectItem={() =>
                            setSelectedLocales(prev =>
                              prev.includes(l.code)
                                ? prev.filter(c => c !== l.code)
                                : [...prev, l.code]
                            )
                          }
                          isChecked={selectedLocales.includes(l.code)}
                        />
                      ))}
                    </Multiselect>
                    <FormControl.HelpText>
                      Select specific locales to include in export
                    </FormControl.HelpText>
                  </FormControl>

                  {/* Tags */}
                  <FormControl style={{ flex: '1 1 180px', marginBottom: 0 }}>
                    <FormControl.Label>Tags</FormControl.Label>
                    <Multiselect
                      currentSelection={selectedTags}
                      placeholder="Select one or more"
                    >
                      {availableTags.map(tag => (
                        <Multiselect.Option
                          key={tag.sys.id}
                          itemId={tag.sys.id}
                          value={tag.sys.id}
                          label={tag.name}
                          onSelectItem={() =>
                            setSelectedTags(prev =>
                              prev.includes(tag.sys.id)
                                ? prev.filter(t => t !== tag.sys.id)
                                : [...prev, tag.sys.id]
                            )
                          }
                          isChecked={selectedTags.includes(tag.sys.id)}
                        />
                      ))}
                    </Multiselect>
                  </FormControl>

                  {/* Taxonomy concepts */}
                  {availableConcepts.length > 0 && (
                    <FormControl style={{ flex: '1 1 180px', marginBottom: 0 }}>
                      <FormControl.Label>Taxonomy concepts</FormControl.Label>
                      <Multiselect
                        currentSelection={selectedConcepts}
                        placeholder="Select one or more"
                      >
                        {availableConcepts.map(concept => (
                          <Multiselect.Option
                            key={concept.sys.id}
                            itemId={concept.sys.id}
                            value={concept.sys.id}
                            label={Object.values(concept.prefLabel)[0] || concept.sys.id}
                            onSelectItem={() =>
                              setSelectedConcepts(prev =>
                                prev.includes(concept.sys.id)
                                  ? prev.filter(c => c !== concept.sys.id)
                                  : [...prev, concept.sys.id]
                              )
                            }
                            isChecked={selectedConcepts.includes(concept.sys.id)}
                          />
                        ))}
                      </Multiselect>
                    </FormControl>
                  )}
                </Flex>

                {/* Additive filter buttons */}
                <Flex gap="spacingS" marginTop="spacingM" flexWrap="wrap">
                  <Tooltip
                    content={selectedContentType ? 'Add a filter on a specific field' : 'Select a content type first'}
                    placement="top"
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      startIcon={<PlusIcon />}
                      onClick={handleAddFieldFilter}
                      isDisabled={isExporting || !selectedContentType}
                    >
                      Field filter
                    </Button>
                  </Tooltip>

                  {!showCreatedRange && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      startIcon={<PlusIcon />}
                      onClick={() => setShowCreatedRange(true)}
                      isDisabled={isExporting}
                    >
                      Created date range
                    </Button>
                  )}

                  {!showUpdatedRange && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      startIcon={<PlusIcon />}
                      onClick={() => setShowUpdatedRange(true)}
                      isDisabled={isExporting}
                    >
                      Updated date range
                    </Button>
                  )}
                </Flex>

                {/* Field filters */}
                {fieldFilters.map((filter, index) => (
                  <div key={index} className={styles.fieldFilterRow}>
                    <Flex gap="spacingS" alignItems="flex-end" flexWrap="wrap">
                      <FormControl style={{ flex: 1, minWidth: 0, marginBottom: 0 }}>
                        <FormControl.Label>Field</FormControl.Label>
                        <Select
                          value={filter.fieldId}
                          onChange={(e) => handleFieldFilterChange(index, 'fieldId', e.target.value)}
                          isDisabled={isExporting || !selectedContentType}
                        >
                          <Select.Option value="">Select field</Select.Option>
                          {selectedContentType?.fields.map(field => (
                            <Select.Option key={field.id} value={field.id}>
                              {field.name || field.id}
                            </Select.Option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl style={{ flex: 1, minWidth: 0, marginBottom: 0 }}>
                        <FormControl.Label>Operator</FormControl.Label>
                        <Select
                          value={filter.operator}
                          onChange={(e) => handleFieldFilterChange(index, 'operator', e.target.value)}
                          isDisabled={isExporting}
                        >
                          <Select.Option value="equals">Equals</Select.Option>
                          <Select.Option value="not_equals">Not equals</Select.Option>
                          <Select.Option value="contains">Contains</Select.Option>
                          <Select.Option value="gt">Greater than</Select.Option>
                          <Select.Option value="gte">Greater than or equal</Select.Option>
                          <Select.Option value="lt">Less than</Select.Option>
                          <Select.Option value="lte">Less than or equal</Select.Option>
                          <Select.Option value="exists">Exists</Select.Option>
                          <Select.Option value="is_true">Is true</Select.Option>
                          <Select.Option value="is_false">Is false</Select.Option>
                          <Select.Option value="links_to">Links to entry ID</Select.Option>
                        </Select>
                      </FormControl>
                      <FormControl style={{ flex: 1, minWidth: 0, marginBottom: 0 }}>
                        <FormControl.Label>Value</FormControl.Label>
                        <TextInput
                          value={filter.value}
                          onChange={(e) => handleFieldFilterChange(index, 'value', e.target.value)}
                          isDisabled={isExporting || filter.operator === 'is_true' || filter.operator === 'is_false'}
                          placeholder="Value"
                        />
                      </FormControl>
                      <IconButton
                        variant="secondary"
                        icon={<TrashSimpleIcon />}
                        aria-label="Remove filter"
                        size="medium"
                        onClick={() => handleRemoveFieldFilter(index)}
                        isDisabled={isExporting}
                      />
                    </Flex>
                  </div>
                ))}

                {/* Created date range */}
                {showCreatedRange && (
                  <div className={styles.dateRangeCard}>
                    <Flex alignItems="center" gap="spacingXs" marginBottom="spacingS">
                      <Paragraph marginBottom="none">Created date range</Paragraph>
                      <Tooltip content="Filter entries created within this date range" placement="top">
                        <IconButton
                          variant="transparent"
                          icon={<InfoIcon />}
                          aria-label="About created date range"
                          size="small"
                        />
                      </Tooltip>
                    </Flex>
                    <Flex gap="spacingS" alignItems="flex-end">
                      <FormControl style={{ flex: 1, marginBottom: 0 }}>
                        <FormControl.Label>Start</FormControl.Label>
                        <Datepicker
                          selected={createdFrom ? new Date(createdFrom) : undefined}
                          onSelect={(day) => setCreatedFrom(day ? day.toISOString().split('T')[0] : '')}
                          inputProps={{ isDisabled: isExporting }}
                        />
                      </FormControl>
                      <FormControl style={{ flex: 1, marginBottom: 0 }}>
                        <FormControl.Label>End</FormControl.Label>
                        <Datepicker
                          selected={createdTo ? new Date(createdTo) : undefined}
                          onSelect={(day) => setCreatedTo(day ? day.toISOString().split('T')[0] : '')}
                          inputProps={{ isDisabled: isExporting }}
                        />
                      </FormControl>
                      <IconButton
                        variant="secondary"
                        icon={<TrashSimpleIcon />}
                        aria-label="Remove created date range"
                        size="medium"
                        onClick={() => { setShowCreatedRange(false); setCreatedFrom(''); setCreatedTo(''); }}
                        isDisabled={isExporting}
                      />
                    </Flex>
                  </div>
                )}

                {/* Updated date range */}
                {showUpdatedRange && (
                  <div className={styles.dateRangeCard}>
                    <Flex alignItems="center" gap="spacingXs" marginBottom="spacingS">
                      <Paragraph marginBottom="none">Updated date range</Paragraph>
                      <Tooltip content="Filter entries updated within this date range" placement="top">
                        <IconButton
                          variant="transparent"
                          icon={<InfoIcon />}
                          aria-label="About updated date range"
                          size="small"
                        />
                      </Tooltip>
                    </Flex>
                    <Flex gap="spacingS" alignItems="flex-end">
                      <FormControl style={{ flex: 1, marginBottom: 0 }}>
                        <FormControl.Label>Start</FormControl.Label>
                        <Datepicker
                          selected={updatedFrom ? new Date(updatedFrom) : undefined}
                          onSelect={(day) => setUpdatedFrom(day ? day.toISOString().split('T')[0] : '')}
                          inputProps={{ isDisabled: isExporting }}
                        />
                      </FormControl>
                      <FormControl style={{ flex: 1, marginBottom: 0 }}>
                        <FormControl.Label>End</FormControl.Label>
                        <Datepicker
                          selected={updatedTo ? new Date(updatedTo) : undefined}
                          onSelect={(day) => setUpdatedTo(day ? day.toISOString().split('T')[0] : '')}
                          inputProps={{ isDisabled: isExporting }}
                        />
                      </FormControl>
                      <IconButton
                        variant="secondary"
                        icon={<TrashSimpleIcon />}
                        aria-label="Remove updated date range"
                        size="medium"
                        onClick={() => { setShowUpdatedRange(false); setUpdatedFrom(''); setUpdatedTo(''); }}
                        isDisabled={isExporting}
                      />
                    </Flex>
                  </div>
                )}
              </div>
            </div>
    </form>
  );
}
