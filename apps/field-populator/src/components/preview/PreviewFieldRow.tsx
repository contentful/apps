import { ContentTypeField } from '@contentful/app-sdk';
import { Box, Checkbox, Flex, Grid, Paragraph, Text, TextLink } from '@contentful/f36-components';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';
import PreviewField from './PreviewField';

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
    <Box paddingTop="spacingM" paddingBottom="spacingM">
      <Flex justifyContent="space-between" alignItems="center" marginBottom="spacingS">
        <Box marginBottom="spacingM">
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
