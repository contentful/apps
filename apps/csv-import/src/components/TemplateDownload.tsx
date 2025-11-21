import React from 'react';
import { Box, Button, FormControl, Select, Text } from '@contentful/f36-components';
import { DownloadIcon } from '@contentful/f36-icons';
import { ContentTypeMeta, ImportMode } from '../lib/types';
import { downloadTemplate } from '../lib/csv';
import { Locale } from '../hooks/useLocales';

interface TemplateDownloadProps {
  contentType: ContentTypeMeta | null;
  mode: ImportMode;
  locales: Locale[];
  selectedLocale: string | null;
  onLocaleChange: (locale: string) => void;
}

/**
 * Component to download CSV template for a content type
 */
export function TemplateDownload({
  contentType,
  mode,
  locales,
  selectedLocale,
  onLocaleChange,
}: TemplateDownloadProps) {
  const handleDownload = () => {
    if (!contentType) {
      return;
    }
    downloadTemplate(contentType, mode, selectedLocale || undefined);
  };

  if (!contentType) {
    return (
      <Box>
        <Text>Select a content type to download a template</Text>
      </Box>
    );
  }

  return (
    <Box>
      <FormControl>
        <FormControl.Label>Template Locale</FormControl.Label>
        <Select value={selectedLocale || ''} onChange={(e) => onLocaleChange(e.target.value)}>
          <Select.Option value="">Default (no locale suffix)</Select.Option>
          {locales.map((locale) => (
            <Select.Option key={locale.code} value={locale.code}>
              {locale.name} ({locale.code}){locale.default ? ' [default]' : ''}
            </Select.Option>
          ))}
        </Select>
        <FormControl.HelpText>
          If a locale is selected, field columns will include locale suffixes (e.g., title__en-US)
        </FormControl.HelpText>
      </FormControl>

      <Box marginTop="spacingM">
        <Button
          variant="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          isDisabled={!contentType}>
          Download CSV Template
        </Button>
      </Box>

      <Box marginTop="spacingS">
        <Text fontSize="fontSizeS" fontColor="gray600">
          The template includes all editable fields for "{contentType.name}".
          {mode === 'update' && ' It includes a sys.id column for matching existing entries.'}
        </Text>
      </Box>
    </Box>
  );
}
