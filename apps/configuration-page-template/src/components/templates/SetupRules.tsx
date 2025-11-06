import { useState } from 'react';
import {
  Subheading,
  Paragraph,
  Flex,
  Autocomplete,
  TextInput,
  IconButton,
  Button,
  Text,
} from '@contentful/f36-components';
import { PlusIcon, DeleteIcon, InfoCircleIcon } from '@contentful/f36-icons';

interface Rule {
  id: string;
  column1: string;
  column2: string;
  column3: string;
}

interface SetupRulesProps {
  rules?: Rule[];
  setRules?: (rules: Rule[]) => void;
}

// Default mock rules
const defaultRules: Rule[] = [
  { id: '1', column1: '', column2: '', column3: '' },
  { id: '2', column1: '', column2: '', column3: '' },
  { id: '3', column1: '', column2: '', column3: '' },
];

export default function SetupRules({ rules: propRules, setRules: propSetRules }: SetupRulesProps) {
  // Use internal state if props are not provided
  const [internalRules, setInternalRules] = useState<Rule[]>(defaultRules);

  const rules = propRules ?? internalRules;
  const setRules = propSetRules ?? setInternalRules;

  // Mock data for autocomplete dropdowns
  const mockOptions = [
    { id: '1', name: 'Option 1' },
    { id: '2', name: 'Option 2' },
    { id: '3', name: 'Option 3' },
  ];

  const handleAddRow = () => {
    const newRule: Rule = {
      id: Date.now().toString(),
      column1: '',
      column2: '',
      column3: '',
    };
    setRules([...rules, newRule]);
  };

  const handleDeleteRow = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const handleColumn1Change = (id: string, value: string) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, column1: value } : rule)));
  };

  const handleColumn2Change = (id: string, value: string) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, column2: value } : rule)));
  };

  const handleColumn3Change = (id: string, value: string) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, column3: value } : rule)));
  };

  return (
    <Flex flexDirection="column" gap="spacingL" paddingTop="spacingM" paddingBottom="spacingM">
      {/* Section header */}
      <Flex flexDirection="column" gap="spacingXs">
        <Subheading marginBottom="none">Set up rules</Subheading>
        <Flex flexDirection="row" alignItems="center" gap="spacing2Xs">
          <Paragraph marginBottom="none">
            Section subtitle with basic instructions and info icon with tool tip
          </Paragraph>
          <InfoCircleIcon variant="muted" size="small" />
        </Flex>
      </Flex>

      {/* Rules form */}
      <Flex flexDirection="column" gap="spacingXs">
        {/* Column headers */}
        <Flex flexDirection="row" gap="spacingXs" alignItems="center">
          <Flex style={{ width: '260px' }}>
            <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
              Column 1
            </Text>
          </Flex>
          <Flex style={{ width: '260px' }}>
            <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
              Column 1
            </Text>
          </Flex>
          <Flex style={{ width: '260px' }}>
            <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
              Column 1
            </Text>
          </Flex>
          <Flex style={{ width: '40px' }} />
        </Flex>

        {/* Rule rows */}
        {rules.map((rule) => (
          <Flex key={rule.id} flexDirection="row" gap="spacingXs" alignItems="center">
            {/* Column 1 - Autocomplete */}
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

            {/* Column 2 - Autocomplete */}
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

            {/* Column 3 - Text Input */}
            <Flex style={{ width: '260px' }}>
              <TextInput
                value={rule.column3}
                onChange={(e) => handleColumn3Change(rule.id, e.target.value)}
                placeholder="Value"
              />
            </Flex>

            {/* Delete button */}
            <IconButton
              variant="secondary"
              icon={<DeleteIcon />}
              aria-label="Delete row"
              onClick={() => handleDeleteRow(rule.id)}
            />
          </Flex>
        ))}

        {/* Add row button */}
        <Flex>
          <Button variant="secondary" size="small" startIcon={<PlusIcon />} onClick={handleAddRow}>
            Add row
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
