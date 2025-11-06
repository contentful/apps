import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Autocomplete,
  Button,
  Card,
  Flex,
  IconButton,
  Paragraph,
  Subheading,
  Text,
  TextInput,
} from '@contentful/f36-components';
import { InfoIcon, PlusIcon, TrashSimpleIcon } from '@contentful/f36-icons';

export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const [rules, setRules] = useState([{ id: '1', column1: '', column2: '', column3: '' }]);

  const mockOptions = [
    { id: '1', name: 'Option 1' },
    { id: '2', name: 'Option 2' },
    { id: '3', name: 'Option 3' },
  ];

  const handleColumn1Change = (id: string, value: string) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, column1: value } : rule)));
  };

  const handleColumn2Change = (id: string, value: string) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, column2: value } : rule)));
  };

  const handleColumn3Change = (id: string, value: string) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, column3: value } : rule)));
  };

  const handleAddRow = () => {
    setRules([...rules, { id: Date.now().toString(), column1: '', column2: '', column3: '' }]);
  };

  const handleDeleteRow = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      fullWidth
      gap="spacingM"
      style={{ padding: '20px 80px' }}>
      <Card padding="large">
        <Flex flexDirection="column" gap="spacingL">
          <Flex flexDirection="column" gap="spacingXs">
            <Subheading marginBottom="none">Set up rules</Subheading>
            <Flex flexDirection="row" alignItems="center" gap="spacing2Xs">
              <Paragraph marginBottom="none">
                Section subtitle with basic instructions and info icon with tool tip
              </Paragraph>
              <InfoIcon variant="muted" size="small" />
            </Flex>
          </Flex>

          <Flex flexDirection="column" gap="spacingXs">
            <Flex flexDirection="row" gap="spacingXs" alignItems="center">
              <Flex style={{ width: '260px' }}>
                <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
                  Column 1
                </Text>
              </Flex>
              <Flex style={{ width: '260px' }}>
                <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
                  Column 2
                </Text>
              </Flex>
              <Flex style={{ width: '260px' }}>
                <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
                  Column 3
                </Text>
              </Flex>
              <Flex style={{ width: '40px' }} />
            </Flex>

            {rules.map((rule) => (
              <Flex key={rule.id} flexDirection="row" gap="spacingXs" alignItems="center">
                <Flex style={{ width: '260px' }}>
                  <Autocomplete
                    items={mockOptions}
                    onInputValueChange={(value) => handleColumn1Change(rule.id, value)}
                    onSelectItem={(item) => handleColumn1Change(rule.id, item.name)}
                    placeholder="Search"
                    itemToString={(item) => item.name}
                    renderItem={(item) => <Text>{item.name}</Text>}
                    textOnAfterSelect="clear"
                    closeAfterSelect={true}
                    listWidth="full"
                  />
                </Flex>
                <Flex style={{ width: '260px' }}>
                  <Autocomplete
                    items={mockOptions}
                    onInputValueChange={(value) => handleColumn2Change(rule.id, value)}
                    onSelectItem={(item) => handleColumn2Change(rule.id, item.name)}
                    placeholder="Search"
                    itemToString={(item) => item.name}
                    renderItem={(item) => <Text>{item.name}</Text>}
                    textOnAfterSelect="clear"
                    closeAfterSelect={true}
                    listWidth="full"
                  />
                </Flex>
                <Flex style={{ width: '260px' }}>
                  <TextInput
                    value={rule.column3}
                    onChange={(e) => handleColumn3Change(rule.id, e.target.value)}
                    placeholder="Value"
                  />
                </Flex>
                <IconButton
                  variant="secondary"
                  icon={<TrashSimpleIcon />}
                  aria-label="Delete row"
                  onClick={() => handleDeleteRow(rule.id)}
                />
              </Flex>
            ))}

            <Flex>
              <Button
                variant="secondary"
                size="small"
                startIcon={<PlusIcon />}
                onClick={handleAddRow}>
                Add row
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
};

export default ConfigScreen;
