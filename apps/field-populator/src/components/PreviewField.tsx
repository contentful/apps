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
  if (value === undefined || value === null || value === '') {
    return (
      <PreviewBox>
        <Text>(empty)</Text>
      </PreviewBox>
    );
  }

  if (isRichTextField(fieldDefinition)) {
    const document = value as Document;
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
    if (value.length === 0) {
      return (
        <PreviewBox>
          <Text>(empty)</Text>
        </PreviewBox>
      );
    }
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
    if (value.length === 0) {
      return (
        <PreviewBox>
          <Text>(empty)</Text>
        </PreviewBox>
      );
    }
    return (
      <PreviewBox>
        <Box>{value.map((link) => 'Reference')}</Box>
      </PreviewBox>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <PreviewBox>
          <Text>(empty)</Text>
        </PreviewBox>
      );
    }
    return (
      <PreviewBox>
        <Text>{value.join(', ')}</Text>
      </PreviewBox>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <PreviewBox>
        <Text>{value ? 'Yes' : 'No'}</Text>
      </PreviewBox>
    );
  }

  if (typeof value === 'object') {
    return (
      <PreviewBox>
        <Text as="pre" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
          {JSON.stringify(value, null, 2)}
        </Text>
      </PreviewBox>
    );
  }

  return (
    <PreviewBox>
      <Text>{String(value)}</Text>
    </PreviewBox>
  );
};

export default PreviewField;
