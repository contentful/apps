import { Box, Button, Flex, FormLabel, TextInput } from '@contentful/f36-components';
import { useEffect, useState } from 'react';
import { useDebounce } from 'usehooks-ts';
import { styles } from './ButtonTextField.styles';

interface Props {
  inputValue: string;
  handleInputChange: (inputData: string | ((prev: string) => string)) => void;
}

export const buttons = ['Shorter', 'Longer', 'Casual', 'Formal', 'Simple', 'Witty', 'Tolkien'];

const ButtonTextField = (props: Props) => {
  const { inputValue, handleInputChange } = props;
  const debouncedInputValue = useDebounce(inputValue, 300);

  const [activeButtons, setActiveButtons] = useState(new Set());

  const handleButtonClick = (label: string) => {
    const lowerCaseLabel = label.toLowerCase();

    const updatedActiveButtons = new Set(activeButtons);

    if (activeButtons.has(lowerCaseLabel)) {
      updatedActiveButtons.delete(lowerCaseLabel);
      removeButtonFromInput(lowerCaseLabel);
    } else {
      updatedActiveButtons.add(lowerCaseLabel);
      addButtonToInput(lowerCaseLabel);
    }

    setActiveButtons(updatedActiveButtons);
  };

  const removeButtonFromInput = (label: string) => {
    const labelWithExtraSpacesRegex = new RegExp(`\\s*${label}\\s*,`);

    handleInputChange((prevValue) => {
      const valueWithoutLabel = prevValue.replace(labelWithExtraSpacesRegex, '');
      const trimmedValue = valueWithoutLabel.trim();
      const updatedText = trimmedValue.endsWith(',') ? trimmedValue + ' ' : trimmedValue;

      return updatedText;
    });
  };

  const addButtonToInput = (label: string) => {
    handleInputChange((prevValue) => {
      const trimmedPrev = prevValue.trim();

      if (!trimmedPrev) {
        return `${label}, `;
      }

      const delimiter = trimmedPrev.endsWith(',') ? ' ' : ', ';
      return trimmedPrev + delimiter + `${label}, `;
    });
  };

  const handleTextInput = (inputData: string) => {
    handleInputChange(inputData);
  };

  useEffect(() => {
    const updateActiveButtons = () => {
      const inputDataArray = debouncedInputValue
        .toLowerCase()
        .split(',')
        ?.map((value) => value.trim());

      const inputSet = new Set(inputDataArray || []);
      const updatedActiveButtons = new Set();

      buttons.forEach((button) => {
        const lowerCaseButton = button.toLowerCase();

        if (inputSet.has(lowerCaseButton)) {
          updatedActiveButtons.add(lowerCaseButton);
        }
      });

      setActiveButtons(updatedActiveButtons);
    };

    updateActiveButtons();
  }, [debouncedInputValue]);

  return (
    <Box width={100} css={styles.wrapper}>
      <FormLabel>Select tone options</FormLabel>
      <Flex flexWrap="wrap" marginBottom={'spacingL'}>
        {buttons.map((buttonLabel) => (
          <Button
            css={styles.button}
            key={buttonLabel}
            onClick={() => handleButtonClick(buttonLabel)}
            isActive={activeButtons.has(buttonLabel.toLowerCase())}>
            {buttonLabel}
          </Button>
        ))}
      </Flex>

      <FormLabel>Additional instructions</FormLabel>
      <TextInput
        type="text"
        placeholder='eg. "Shorter, casual, for Star Wars fans..."'
        value={inputValue}
        onChange={(e) => handleTextInput(e.target.value)}
      />
    </Box>
  );
};

export default ButtonTextField;
