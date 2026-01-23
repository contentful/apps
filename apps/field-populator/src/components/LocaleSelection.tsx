import { Flex, Subheading, FormControl, Select } from '@contentful/f36-components';
import { isSameLocaleFamily, normalizeLocaleCode, SimplifiedLocale } from '../utils/locales';
import LocaleMultiSelect from './LocaleMultiSelect';
import { useState } from 'react';

interface LocaleSelectionProps {
  availableLocales: SimplifiedLocale[];
  selectedSourceLocale: string | null;
  selectedTargetLocales: SimplifiedLocale[];
  onSourceLocaleChange: (locale: string) => void;
  onTargetLocalesChange: (locales: SimplifiedLocale[]) => void;
  missingSourceLocale: boolean;
  missingTargetLocales: boolean;
}

const LocaleSelection = ({
  availableLocales,
  selectedSourceLocale,
  selectedTargetLocales,
  onSourceLocaleChange,
  onTargetLocalesChange,
  missingSourceLocale,
  missingTargetLocales,
}: LocaleSelectionProps) => {
  const [availableTargetLocales, setAvailableTargetLocales] = useState<SimplifiedLocale[]>([]);

  const onSourceLocaleSelected = (newSourceLocale: string) => {
    const newAvailableTargetLocales = availableLocales.filter(
      (targetLocale) =>
        newSourceLocale !== targetLocale.code &&
        isSameLocaleFamily(newSourceLocale, targetLocale.code)
    );
    const newSelectedTargetLocales = selectedTargetLocales.filter((locale) =>
      isSameLocaleFamily(newSourceLocale, locale.code)
    );

    onSourceLocaleChange(newSourceLocale);
    onTargetLocalesChange(newSelectedTargetLocales);
    setAvailableTargetLocales(newAvailableTargetLocales);
  };

  return (
    <Flex flexDirection="column">
      <Subheading>Select source and target locales</Subheading>
      <FormControl isRequired isInvalid={missingSourceLocale}>
        <FormControl.Label>Source locale</FormControl.Label>
        <Select
          id="source-locale"
          name="source-locale"
          testId="source-locale-select"
          onChange={(event) => onSourceLocaleSelected(event.target.value)}>
          {!selectedSourceLocale && (
            <Select.Option key={`select-locale-empty`} value={undefined}>
              Select one
            </Select.Option>
          )}
          {availableLocales.map((locale) => (
            <Select.Option
              key={`select-locale-${normalizeLocaleCode(locale.code)}`}
              data-test-id={`select-locale-${normalizeLocaleCode(locale.code)}`}
              value={locale.code}>
              {locale.name}
            </Select.Option>
          ))}
        </Select>
        <FormControl.HelpText>
          The source locale is the source field that content wil be copied from.
        </FormControl.HelpText>
        {missingSourceLocale && (
          <FormControl.ValidationMessage>Select source locale</FormControl.ValidationMessage>
        )}
      </FormControl>
      <FormControl isRequired isInvalid={missingTargetLocales}>
        <FormControl.Label>Target locales</FormControl.Label>
        <LocaleMultiSelect
          availableLocales={availableTargetLocales}
          selectedLocales={selectedTargetLocales}
          onSelectionChange={onTargetLocalesChange}
          isInvalid={missingTargetLocales}
          isDisabled={!selectedSourceLocale}
        />
        <FormControl.HelpText>
          The target locales are the fields that content will be pasted into.
        </FormControl.HelpText>
        {missingTargetLocales && (
          <FormControl.ValidationMessage>Select target locales</FormControl.ValidationMessage>
        )}
      </FormControl>
    </Flex>
  );
};

export default LocaleSelection;
