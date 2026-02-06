import { ContentTypeField } from '@contentful/app-sdk';
import { Box, Checkbox, Flex, Grid, Paragraph, Text } from '@contentful/f36-components';
import PreviewField from './PreviewField';
import { styles } from './PreviewFieldRow.styles';

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
    <Box padding="spacingS" className={styles.fieldBox}>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingS">
        <Box marginBottom="spacingM">
          <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
            {field.name}
          </Text>
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
          <PreviewField
            value={targetValue}
            fieldDefinition={field}
            locale={targetLocale}
            compareValue={sourceValue}
          />
        </Box>
      </Grid>
    </Box>
  );
};

export default PreviewFieldRow;
