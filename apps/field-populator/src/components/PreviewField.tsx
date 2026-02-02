import { ContentTypeField } from '@contentful/app-sdk';
import { Box, Flex, Text } from '@contentful/f36-components';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { Document } from '@contentful/rich-text-types';
import { css } from 'emotion';
import {
  isAssetArrayField,
  isAssetField,
  isEntryArrayField,
  isEntryField,
  isRichTextField,
} from '../utils/fieldTypes';
import CustomAssetCard from './CustomAssetCard';
import PreviewBox from './PreviewBox';

interface PreviewFieldProps {
  value: unknown;
  fieldDefinition: ContentTypeField;
  locale: string;
}

interface LinkValue {
  sys: {
    type: 'Link';
    linkType: 'Asset' | 'Entry';
    id: string;
  };
}

const styles = {
  emptyValue: css({
    color: '#8091a5',
    fontStyle: 'italic',
  }),
  richTextContent: css({
    '& p': {
      marginBottom: '0.5em',
    },
    '& p:last-child': {
      marginBottom: 0,
    },
  }),
  assetGrid: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  }),
  entryStack: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }),
};

const isLinkValue = (value: unknown): value is LinkValue => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sys' in value &&
    typeof (value as LinkValue).sys === 'object' &&
    (value as LinkValue).sys.type === 'Link'
  );
};

const isLinkArray = (value: unknown): value is LinkValue[] => {
  return Array.isArray(value) && value.every(isLinkValue);
};

const PreviewField = ({ value, fieldDefinition, locale }: PreviewFieldProps) => {
  // Handle empty/undefined values
  if (value === undefined || value === null || value === '') {
    return (
      <PreviewBox>
        <Text className={styles.emptyValue}>(empty)</Text>
      </PreviewBox>
    );
  }

  // Handle Rich Text fields
  if (isRichTextField(fieldDefinition)) {
    const document = value as Document;
    return (
      <PreviewBox className={styles.richTextContent}>
        {documentToReactComponents(document)}
      </PreviewBox>
    );
  }

  // Handle single Asset link
  if (isAssetField(fieldDefinition) && isLinkValue(value)) {
    return (
      <PreviewBox>
        <CustomAssetCard assetId={value.sys.id} locale={locale} />
      </PreviewBox>
    );
  }

  // Handle single Entry reference
  if (isEntryField(fieldDefinition) && isLinkValue(value)) {
    return <PreviewBox>Reference</PreviewBox>;
  }

  // Handle Array of Assets
  if (isAssetArrayField(fieldDefinition) && isLinkArray(value)) {
    if (value.length === 0) {
      return (
        <PreviewBox>
          <Text className={styles.emptyValue}>(empty)</Text>
        </PreviewBox>
      );
    }
    return (
      <PreviewBox>
        <Flex className={styles.assetGrid}>
          {value.map((link) => (
            <CustomAssetCard key={link.sys.id} assetId={link.sys.id} locale={locale} />
          ))}
        </Flex>
      </PreviewBox>
    );
  }

  // Handle Array of Entry references
  if (isEntryArrayField(fieldDefinition) && isLinkArray(value)) {
    if (value.length === 0) {
      return (
        <PreviewBox>
          <Text className={styles.emptyValue}>(empty)</Text>
        </PreviewBox>
      );
    }
    return (
      <PreviewBox>
        <Box className={styles.entryStack}>{value.map((link) => 'Reference')}</Box>
      </PreviewBox>
    );
  }

  // Handle arrays of primitive values
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <PreviewBox>
          <Text className={styles.emptyValue}>(empty)</Text>
        </PreviewBox>
      );
    }
    return (
      <PreviewBox>
        <Text>{value.join(', ')}</Text>
      </PreviewBox>
    );
  }

  // Handle boolean values
  if (typeof value === 'boolean') {
    return (
      <PreviewBox>
        <Text>{value ? 'Yes' : 'No'}</Text>
      </PreviewBox>
    );
  }

  // Handle objects (JSON fields)
  if (typeof value === 'object') {
    return (
      <PreviewBox>
        <Text as="pre" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
          {JSON.stringify(value, null, 2)}
        </Text>
      </PreviewBox>
    );
  }

  // Handle all other primitive values (strings, numbers, dates)
  return (
    <PreviewBox>
      <Text>{String(value)}</Text>
    </PreviewBox>
  );
};

export default PreviewField;
