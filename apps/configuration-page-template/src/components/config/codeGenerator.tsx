interface BlockComponent {
  jsx: string;
  imports: Set<string>;
}

const blockComponentMap: Record<string, BlockComponent> = {
  'setup-app': {
    jsx: `    <Flex flexDirection="column" gap="spacingL">
      <Flex flexDirection="column" gap="spacingXs">
        <Subheading marginBottom="none">How does it work?</Subheading>
        <Paragraph marginBottom="none">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </Paragraph>
      </Flex>
      <Flex flexDirection="column" gap="spacingXs">
        <Subheading marginBottom="none">Set up your Workspace</Subheading>
        <Paragraph marginBottom="none">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </Paragraph>
      </Flex>
    </Flex>`,
    imports: new Set(['Flex', 'Subheading', 'Paragraph']),
  },
  'configure-via-key': {
    jsx: `    <Flex flexDirection="column" gap="spacingL">
      <Flex flexDirection="column" gap="spacingXs">
        <Subheading marginBottom="none">Configure via KEY</Subheading>
        <Paragraph marginBottom="none">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua.
        </Paragraph>
      </Flex>
      <FormControl isRequired>
        <FormControl.Label>API Key</FormControl.Label>
        <TextInput
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
        />
      </FormControl>
      <FormControl isRequired>
        <FormControl.Label>Website URL</FormControl.Label>
        <TextInput
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com"
          icon={<LinkSimpleIcon />}
        />
      </FormControl>
    </Flex>`,
    imports: new Set(['Flex', 'Subheading', 'Paragraph', 'FormControl', 'TextInput']),
  },
  'assign-content-types': {
    jsx: `    <Flex flexDirection="column" gap="spacingL">
      <Flex flexDirection="column" gap="spacingXs">
        <Subheading marginBottom="none">Assign content types</Subheading>
        <Paragraph marginBottom="none">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua.
        </Paragraph>
      </Flex>

      <FormControl>
        <FormControl.Label>Select content types</FormControl.Label>
        <Autocomplete
          items={filteredContentTypes}
          itemToString={(item) => item.name}
          onInputValueChange={(value) => setSearchQuery(value)}
          onSelectItem={handleSelectItem}
          isLoading={false}
          placeholder="Search content types..."
          inputValue={searchQuery}
          textOnAfterSelect="clear"
        />
      </FormControl>

      {selectedContentTypes.length > 0 && (
        <Flex flexDirection="column" gap="spacingXs">
          <Text fontWeight="fontWeightMedium">Selected content types:</Text>
          <Flex gap="spacingXs" flexWrap="wrap">
            {selectedContentTypes.map((ct) => (
              <Pill
                key={ct.id}
                label={ct.name}
                onClose={() => handleUnselectItem(ct)}
                dragHandleComponent={() => <></>}
              />
            ))}
          </Flex>
        </Flex>
      )}

      {isAllSelected && (
        <Note variant="positive">
          All content types have been selected.
        </Note>
      )}
    </Flex>`,
    imports: new Set([
      'Flex',
      'Subheading',
      'Paragraph',
      'FormControl',
      'Autocomplete',
      'Text',
      'Pill',
      'Note',
    ]),
  },
  'set-up-rules': {
    jsx: `    <Flex flexDirection="column" gap="spacingL">
      <Flex flexDirection="column" gap="spacingXs">
        <Subheading marginBottom="none">Set up rules</Subheading>
        <Paragraph marginBottom="none">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua.
        </Paragraph>
      </Flex>

      <Note variant="neutral">
        <Flex alignItems="center" gap="spacingXs">
          <InfoIcon variant="muted" />
          <Text fontColor="gray700">Rules are applied to determine which content types are valid.</Text>
        </Flex>
      </Note>

      <Flex flexDirection="column" gap="spacingS">
        {rules.map((rule) => (
          <Flex key={rule.id} gap="spacingS" alignItems="flex-end">
            <Flex flexDirection="column" gap="spacingXs" style={{ flex: '1' }}>
              <Text fontWeight="fontWeightMedium" fontSize="fontSizeS">
                Column 1
              </Text>
              <Autocomplete
                items={mockOptions}
                itemToString={(item) => item.name}
                onSelectItem={(item) => handleColumn1Change(rule.id, item.name)}
                placeholder="Select option"
                inputValue={rule.column1}
                textOnAfterSelect="preserve"
              />
            </Flex>
            <Flex flexDirection="column" gap="spacingXs" style={{ flex: '1' }}>
              <Text fontWeight="fontWeightMedium" fontSize="fontSizeS">
                Column 2
              </Text>
              <Autocomplete
                items={mockOptions}
                itemToString={(item) => item.name}
                onSelectItem={(item) => handleColumn2Change(rule.id, item.name)}
                placeholder="Select option"
                inputValue={rule.column2}
                textOnAfterSelect="preserve"
              />
            </Flex>
            <Flex flexDirection="column" gap="spacingXs" style={{ flex: '1' }}>
              <Text fontWeight="fontWeightMedium" fontSize="fontSizeS">
                Column 3
              </Text>
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
          <Button variant="secondary" size="small" startIcon={<PlusIcon />} onClick={handleAddRow}>
            Add row
          </Button>
        </Flex>
      </Flex>
    </Flex>`,
    imports: new Set([
      'Flex',
      'Subheading',
      'Paragraph',
      'Text',
      'Autocomplete',
      'TextInput',
      'IconButton',
      'Button',
    ]),
  },
  disclaimer: {
    jsx: `    <Flex flexDirection="column" gap="spacingL">
      <Flex flexDirection="column" gap="spacingXs">
        <Subheading marginBottom="none">Disclaimer</Subheading>
        <Paragraph marginBottom="none">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </Paragraph>
      </Flex>
    </Flex>`,
    imports: new Set(['Flex', 'Subheading', 'Paragraph']),
  },
};

export const generateCombinedCode = (selectedBlocks: string[]): string => {
  // Collect all unique imports
  const allImports = new Set<string>();
  const iconImports = new Set<string>();
  let needsAdditionalState = false;

  selectedBlocks.forEach((blockId) => {
    const block = blockComponentMap[blockId];
    if (block) {
      block.imports.forEach((imp) => allImports.add(imp));
      // Always need Card for wrapping
      allImports.add('Card');

      // Check if we need specific imports
      if (blockId === 'configure-via-key') {
        needsAdditionalState = true;
        iconImports.add('LinkSimpleIcon');
      }
      if (blockId === 'assign-content-types') {
        needsAdditionalState = true;
      }
      if (blockId === 'set-up-rules') {
        needsAdditionalState = true;
        iconImports.add('PlusIcon');
        iconImports.add('TrashSimpleIcon');
        iconImports.add('InfoIcon');
      }
    }
  });

  // Build import statements
  const imports: string[] = [];

  // Always include required imports
  imports.push(`import { useCallback, useState, useEffect } from 'react';`);
  imports.push(`import { ConfigAppSDK } from '@contentful/app-sdk';`);
  imports.push(`import { useSDK } from '@contentful/react-apps-toolkit';`);

  if (allImports.size > 0) {
    const sortedImports = Array.from(allImports).sort();
    imports.push(
      `import {\n  ${sortedImports.join(',\n  ')}\n} from '@contentful/f36-components';`
    );
  }

  if (iconImports.size > 0) {
    const sortedIconImports = Array.from(iconImports).sort();
    imports.push(`import { ${sortedIconImports.join(', ')} } from '@contentful/f36-icons';`);
  }

  // Build additional state declarations (beyond the required ones)
  const additionalStateDeclarations: string[] = [];
  selectedBlocks.forEach((blockId) => {
    if (blockId === 'configure-via-key') {
      additionalStateDeclarations.push(`  const [apiKey, setApiKey] = useState('');`);
      additionalStateDeclarations.push(`  const [websiteUrl, setWebsiteUrl] = useState('');`);
    }
    if (blockId === 'assign-content-types') {
      additionalStateDeclarations.push(
        `  const [selectedContentTypes, setSelectedContentTypes] = useState<{ id: string; name: string }[]>([]);`
      );
      additionalStateDeclarations.push(
        `  const [availableContentTypes, setAvailableContentTypes] = useState<{ id: string; name: string }[]>([]);`
      );
      additionalStateDeclarations.push(`  const [searchQuery, setSearchQuery] = useState('');`);
    }
    if (blockId === 'set-up-rules') {
      additionalStateDeclarations.push(
        `  const [rules, setRules] = useState([{ id: '1', column1: '', column2: '', column3: '' }]);`
      );
    }
  });

  // Build helper functions
  const helperFunctions: string[] = [];
  selectedBlocks.forEach((blockId) => {
    if (blockId === 'set-up-rules') {
      helperFunctions.push(`  const mockOptions = [
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
  };`);
    }
    if (blockId === 'assign-content-types') {
      helperFunctions.push(`  const filteredContentTypes = availableContentTypes.filter(
    (contentType) =>
      !selectedContentTypes.some((selected) => selected.id === contentType.id) &&
      contentType.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectItem = (item: { id: string; name: string }) => {
    setSelectedContentTypes([...selectedContentTypes, item]);
    setSearchQuery('');
  };

  const handleUnselectItem = (item: { id: string; name: string }) => {
    setSelectedContentTypes(selectedContentTypes.filter((ct) => ct.id !== item.id));
  };

  const isAllSelected = selectedContentTypes.length === availableContentTypes.length;`);
    }
  });

  // Build JSX - wrap each block in a Card with border
  const jsxBlocks = selectedBlocks
    .map((blockId) => {
      const block = blockComponentMap[blockId];
      return block ? `      <Card padding="large">\n${block.jsx}\n      </Card>` : null;
    })
    .filter(Boolean);

  // Combine everything with required boilerplate
  return `${imports.join('\n')}

export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();
${additionalStateDeclarations.length > 0 ? '\n' + additionalStateDeclarations.join('\n') : ''}

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);
${helperFunctions.length > 0 ? '\n' + helperFunctions.join('\n\n') + '\n' : ''}
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      fullWidth
      gap="spacingM"
      style={{ padding: '20px 80px' }}>
${jsxBlocks.join('\n\n')}
    </Flex>
  );
};

export default ConfigScreen;`;
};
