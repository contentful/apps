import { ContentTypeField } from '@contentful/app-sdk';
import { Box, Flex, Text } from '@contentful/f36-components';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { Document } from '@contentful/rich-text-types';
import {
  isAssetArrayField,
  isAssetField,
  isEntryArrayField,
  isEntryField,
  isRichTextField,
  isLinkValue,
  isLinkArray,
} from '../../utils/fieldTypes';
import CustomAssetCard from './CustomAssetCard';
import DiffText from './DiffText';
import PreviewBox from './PreviewBox';
import RichTextDiff from './RichTextDiff';

interface PreviewFieldProps {
  value: unknown;
  fieldDefinition: ContentTypeField;
  locale: string;
  compareValue?: unknown;
}

/**
 * Converts a value to a string representation for diff comparison.
 * Returns null if the value cannot be meaningfully compared as text.
 */
const valueToString = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === 'string')) {
      return value.join(', ');
    }
    return null;
  }
  if (typeof value === 'object') {
    // Don't diff Link objects (assets/entries)
    if (isLinkValue(value)) {
      return null;
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const PreviewField = ({ value, fieldDefinition, locale, compareValue }: PreviewFieldProps) => {
  const valueStr = valueToString(value);
  const compareValueStr = compareValue === undefined ? null : valueToString(compareValue);
  const canShowDiff = valueStr !== null && compareValueStr !== null && valueStr !== compareValueStr;

  if (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return (
      <PreviewBox>
        <Text>(empty)</Text>
      </PreviewBox>
    );
  }

  if (isRichTextField(fieldDefinition)) {
    const document = value as Document;
    const compareDocument = compareValue as Document | null | undefined;
    if (canShowDiff) {
      return (
        <PreviewBox>
          <RichTextDiff sourceDocument={document} targetDocument={compareDocument} />
        </PreviewBox>
      );
    }
    return <PreviewBox>{documentToReactComponents(document)}</PreviewBox>;
  }

  if (isAssetField(fieldDefinition) && isLinkValue(value)) {
    return (
      <PreviewBox>
        <CustomAssetCard assetId={value.sys.id} locale={locale} />
      </PreviewBox>
    );
  }

  if (isEntryField(fieldDefinition) && isLinkValue(value)) {
    return <PreviewBox>Reference</PreviewBox>;
  }

  if (isAssetArrayField(fieldDefinition) && isLinkArray(value)) {
    return (
      <PreviewBox>
        <Flex gap="spacingXs" flexWrap="wrap">
          {value.map((link) => (
            <CustomAssetCard key={link.sys.id} assetId={link.sys.id} locale={locale} />
          ))}
        </Flex>
      </PreviewBox>
    );
  }

  if (isEntryArrayField(fieldDefinition) && isLinkArray(value)) {
    return (
      <PreviewBox>
        <Box>{'Reference array'}</Box>
      </PreviewBox>
    );
  }

  if (Array.isArray(value)) {
    if (canShowDiff) {
      return (
        <PreviewBox>
          <DiffText sourceText={valueStr} targetText={compareValueStr} />
        </PreviewBox>
      );
    }
    return (
      <PreviewBox>
        <Text>{valueStr}</Text>
      </PreviewBox>
    );
  }

  if (typeof value === 'boolean') {
    if (canShowDiff) {
      return (
        <PreviewBox>
          <DiffText sourceText={valueStr} targetText={compareValueStr} />
        </PreviewBox>
      );
    }
    return (
      <PreviewBox>
        <Text>{valueStr}</Text>
      </PreviewBox>
    );
  }

  if (typeof value === 'object') {
    if (canShowDiff) {
      return (
        <PreviewBox>
          <DiffText sourceText={valueStr} targetText={compareValueStr} preformatted />
        </PreviewBox>
      );
    }
    return (
      <PreviewBox>
        <Text as="pre" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
          {valueStr}
        </Text>
      </PreviewBox>
    );
  }

  if (canShowDiff) {
    return (
      <PreviewBox>
        <DiffText sourceText={valueStr} targetText={compareValueStr} />
      </PreviewBox>
    );
  }

  return (
    <PreviewBox>
      <Text>{valueStr}</Text>
    </PreviewBox>
  );
};

export default PreviewField;
