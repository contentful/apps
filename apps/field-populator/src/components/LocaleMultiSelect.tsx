import React, { useState } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { SimplifiedLocale } from '../utils/locales';
import { styles } from './LocaleMultiSelect.styles';

interface LocaleMultiSelectProps {
  availableLocales: SimplifiedLocale[];
  selectedLocales: SimplifiedLocale[];
  onSelectionChange: (locales: SimplifiedLocale[]) => void;
  isDisabled?: boolean;
  isInvalid?: boolean;
}

const LocaleMultiSelect: React.FC<LocaleMultiSelectProps> = ({
  availableLocales,
  selectedLocales,
  onSelectionChange,
  isDisabled = false,
  isInvalid = false,
}) => {
  const [filteredLocales, setFilteredLocales] = useState<SimplifiedLocale[]>(availableLocales);

  const handleSearchValueChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    const newFilteredLocales = availableLocales.filter((locale) =>
      locale.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredLocales(newFilteredLocales);
  };

  const handleLocaleToggle = (locale: SimplifiedLocale, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedLocales, locale]);
    } else {
      onSelectionChange(selectedLocales.filter((l) => l.code !== locale.code));
    }
  };

  const handleLocaleRemove = (localeCode: string) => {
    onSelectionChange(selectedLocales.filter((l) => l.code !== localeCode));
  };

  const normalizeCode = (code: string) => {
    return code.toLowerCase().replace(/\s/g, '-');
  };

  return (
    <Stack marginTop="spacingXs" flexDirection="column" alignItems="start">
      <Multiselect
        className={isInvalid ? styles.invalid : undefined}
        searchProps={{
          searchPlaceholder: 'Search locales',
          onSearchValueChange: handleSearchValueChange,
        }}
        placeholder="Select one or more"
        popoverProps={{ isFullWidth: true, listMaxHeight: 110 }}
        currentSelection={selectedLocales.map((l) => l.name)}
        triggerButtonProps={{ isDisabled }}>
        {filteredLocales.map((locale) => (
          <Multiselect.Option
            key={`multiselect-locale-${normalizeCode(locale.code)}`}
            itemId={`multiselect-locale-${normalizeCode(locale.code)}`}
            value={locale.code}
            isChecked={selectedLocales.some((l) => l.code === locale.code)}
            onSelectItem={(e) => handleLocaleToggle(locale, e.target.checked)}>
            {locale.name}
          </Multiselect.Option>
        ))}
      </Multiselect>

      {selectedLocales.length > 0 && (
        <Box width="full" overflow="auto">
          <Stack flexDirection="row" spacing="spacing2Xs" flexWrap="wrap">
            {selectedLocales.map((locale) => (
              <Pill
                key={locale.code}
                testId={`pill-locale-${normalizeCode(locale.code)}`}
                label={locale.name}
                isDraggable={false}
                onClose={() => handleLocaleRemove(locale.code)}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default LocaleMultiSelect;
