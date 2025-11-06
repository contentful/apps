import { FC } from 'react';
import { Box, Flex, Heading, Paragraph, Card, Text, CopyButton } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { vscDarkPlus as theme } from 'react-syntax-highlighter/dist/esm/styles/prism';

const codeStyles = {
  root: {
    padding: '32px',
    overflow: 'scroll',
    height: 'calc(100vh - 101px)',
  } as React.CSSProperties,
  blockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
};

interface CodeViewProps {
  selectedBlocks: string[];
}

// Map block IDs to their component implementations
const blockComponentMap: Record<string, { jsx: string; imports: Set<string> }> = {
  'setup-app': {
    jsx: `    <Flex flexDirection="column" gap="spacingS" fullWidth>
      <Heading as="h1" marginBottom="none">
        Set up my marketplace app
      </Heading>
      <Paragraph marginBottom="none">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat.
      </Paragraph>
    </Flex>`,
    imports: new Set(['Flex', 'Heading', 'Paragraph']),
  },
  'configure-via-key': {
    jsx: `    <Flex flexDirection="column" gap="spacing3Xl" fullWidth>
      <Flex flexDirection="column" gap="spacingL">
        <Flex flexDirection="column" gap="spacingS">
          <Subheading marginBottom="none">Configure access</Subheading>
          <Paragraph marginBottom="none">Section subtitle with basic instructions</Paragraph>
        </Flex>

        <Form>
          <FormControl isRequired marginBottom="spacingL">
            <FormControl.Label>Your key</FormControl.Label>
            <TextInput
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-...dsvb"
            />
            <FormControl.HelpText>
              Help text with{' '}
              <TextLink href="#" icon={<LinkSimpleIcon />} alignIcon="end">
                link out
              </TextLink>
            </FormControl.HelpText>
          </FormControl>

          <FormControl isRequired>
            <FormControl.Label>Your website URL</FormControl.Label>
            <TextInput
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="http://www..."
            />
            <FormControl.HelpText>Help text</FormControl.HelpText>
          </FormControl>
        </Form>
      </Flex>
    </Flex>`,
    imports: new Set([
      'Flex',
      'Form',
      'FormControl',
      'Subheading',
      'Paragraph',
      'TextInput',
      'TextLink',
    ]),
  },
  'assign-content-types': {
    jsx: `    <Box>
      <Heading marginBottom="none">Assign content types</Heading>
      <Paragraph marginBottom="spacingS">Section subtitle with basic instructions</Paragraph>
      <Stack flexDirection="column" alignItems="start" spacing="spacingS">
        <Autocomplete
          items={filteredContentTypes}
          inputValue={searchQuery}
          onInputValueChange={setSearchQuery}
          onSelectItem={handleSelectItem}
          placeholder={isAllSelected ? 'All content types have been selected' : 'Search'}
          isDisabled={isAllSelected}
          itemToString={(item) => item.name}
          renderItem={(item) => <Text fontWeight="fontWeightDemiBold">{item.name}</Text>}
          textOnAfterSelect="clear"
          closeAfterSelect={false}
          listWidth="full"
        />

        {selectedContentTypes.length > 0 && (
          <Box width="full" overflow="auto">
            <Paragraph marginBottom="spacingXs">Selected content types:</Paragraph>
            <Flex flexDirection="row" gap="spacing2Xs" flexWrap="wrap">
              {selectedContentTypes.map((contentType, index) => (
                <Pill
                  key={index}
                  label={contentType.name}
                  isDraggable={false}
                  onClose={() => handleUnselectItem(contentType)}
                />
              ))}
            </Flex>
          </Box>
        )}
      </Stack>
    </Box>`,
    imports: new Set([
      'Box',
      'Heading',
      'Paragraph',
      'Stack',
      'Autocomplete',
      'Text',
      'Flex',
      'Pill',
    ]),
  },
  'set-up-rules': {
    jsx: `    <Flex flexDirection="column" gap="spacingL">
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
            <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">Column 1</Text>
          </Flex>
          <Flex style={{ width: '260px' }}>
            <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">Column 2</Text>
          </Flex>
          <Flex style={{ width: '260px' }}>
            <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">Column 3</Text>
          </Flex>
          <Flex style={{ width: '40px' }} />
        </Flex>

        {rules.map((rule) => (
          <Flex key={rule.id} flexDirection="row" gap="spacingXs" alignItems="center">
            <Flex style={{ width: '260px' }}>
              <Autocomplete
                items={mockOptions}
                inputValue={rule.column1}
                onInputValueChange={(value) => handleColumn1Change(rule.id, value)}
                onSelectItem={(item) => handleColumn1Change(rule.id, item.name)}
                placeholder="Search"
                itemToString={(item) => item.name}
                renderItem={(item) => <Text>{item.name}</Text>}
                textOnAfterSelect="preserve"
                closeAfterSelect={true}
                listWidth="full"
              />
            </Flex>
            <Flex style={{ width: '260px' }}>
              <Autocomplete
                items={mockOptions}
                inputValue={rule.column2}
                onInputValueChange={(value) => handleColumn2Change(rule.id, value)}
                onSelectItem={(item) => handleColumn2Change(rule.id, item.name)}
                placeholder="Search"
                itemToString={(item) => item.name}
                renderItem={(item) => <Text>{item.name}</Text>}
                textOnAfterSelect="preserve"
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

const generateCombinedCode = (selectedBlocks: string[]): string => {
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

export const CodeView: FC<CodeViewProps> = ({ selectedBlocks }) => {
  const combinedCode = selectedBlocks.length > 0 ? generateCombinedCode(selectedBlocks) : '';

  return (
    <Flex flexDirection="column" gap="spacingL" style={codeStyles.root}>
      {selectedBlocks.length === 0 ? (
        <Card padding="large">
          <Flex
            flexDirection="column"
            gap="spacingM"
            alignItems="center"
            justifyContent="center"
            style={{ minHeight: '400px' }}>
            <Heading as="h3" marginBottom="none">
              Select UI Blocks to View Code
            </Heading>
            <Paragraph fontColor="gray600">
              Choose building blocks from the sidebar to see their code here.
            </Paragraph>
          </Flex>
        </Card>
      ) : (
        <Card padding="none">
          <Box style={{ padding: '16px', borderBottom: `1px solid ${tokens.gray300}` }}>
            <Flex style={codeStyles.blockHeader}>
              <Text fontWeight="fontWeightMedium" fontSize="fontSizeM">
                ConfigScreen.tsx
              </Text>
              <CopyButton value={combinedCode} />
            </Flex>
          </Box>
          <Box style={{ overflow: 'auto' }}>
            <SyntaxHighlighter
              language="typescript"
              style={theme}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: '13px',
              }}
              showLineNumbers>
              {combinedCode}
            </SyntaxHighlighter>
          </Box>
        </Card>
      )}
    </Flex>
  );
};
