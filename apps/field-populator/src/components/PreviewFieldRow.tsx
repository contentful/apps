import { ContentTypeField, DialogAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Caption,
  Checkbox,
  Flex,
  Grid,
  Paragraph,
  Text,
  TextLink,
} from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import { css } from 'emotion';
import PreviewField from './PreviewField';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';

interface PreviewFieldRowProps {
  field: ContentTypeField;
  sourceValue: unknown;
  targetValue: unknown;
  sourceLocale: string;
  targetLocale: string;
  isAdopted: boolean;
  onAdoptedChange: (adopted: boolean) => void;
  isDisabled?: boolean;
}

const styles = {
  row: css({
    paddingTop: '16px',
    paddingBottom: '16px',
  }),
  header: css({
    marginBottom: '12px',
  }),
  fieldName: css({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }),
};

const PreviewFieldRow = ({
  field,
  sourceValue,
  targetValue,
  sourceLocale,
  targetLocale,
  isAdopted,
  onAdoptedChange,
  isDisabled = false,
}: PreviewFieldRowProps) => {
  return (
    <Box className={styles.row}>
      <Flex justifyContent="space-between" alignItems="center" className={styles.header}>
        <Box marginBottom="spacingM" className={styles.fieldName}>
          <TextLink
            href={''}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ArrowSquareOutIcon variant="muted" size="tiny" />}
            alignIcon="end">
            <Text fontColor="blue600" fontWeight="fontWeightDemiBold">
              {field.name}
            </Text>
          </TextLink>
        </Box>
        <Checkbox
          isChecked={isAdopted}
          onChange={(e) => onAdoptedChange(e.target.checked)}
          isDisabled={isDisabled}>
          Adopt this field
        </Checkbox>
      </Flex>

      <Grid columns="1fr 1fr" columnGap="spacingM">
        <Box>
          <Paragraph marginBottom="spacingXs" fontWeight="fontWeightMedium">
            Source
          </Paragraph>
          <PreviewField value={sourceValue} fieldDefinition={field} locale={sourceLocale} />
        </Box>
        <Box>
          <Paragraph marginBottom="spacingXs" fontWeight="fontWeightMedium">
            Target
          </Paragraph>
          <PreviewField value={targetValue} fieldDefinition={field} locale={targetLocale} />
        </Box>
      </Grid>
    </Box>
  );
};

export default PreviewFieldRow;
