import React, { useEffect, useState } from 'react';
import { EditorExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { Box, CopyButton, Flex, FormControl, Select, Stack } from '@contentful/f36-components';
import ReactJson from 'react-json-view';

const defaultConfigOptions = {
  displayDataTypes: 'false',
  iconStyle: 'triangle',
  collapsed: 'false',
  theme: 'rjv-default',
  defaultIncludeDepth: '0',
};

const Entry = () => {
  const sdk = useSDK<EditorExtensionSDK>();
  const cma = useCMA();
  const currentEntry = sdk.entry.getSys();
  const [entry, setEntry] = useState({});
  // Get the viewer options set in app config.
  const configOptions = {
    ...defaultConfigOptions,
    ...(sdk.parameters.installation?.configOptions ?? sdk.parameters.configOptions ?? {}),
  };
  const [selectValue, setSelectValue] = useState(configOptions.defaultIncludeDepth);
  const handleOnChange = (event: any) => setSelectValue(event.target.value);

  useEffect(() => {
    setSelectValue(configOptions.defaultIncludeDepth);
  }, [configOptions.defaultIncludeDepth]);

  useEffect(() => {
    let entryData = {};
    const fetchEntry = async () => {
      if (selectValue === '0') {
        entryData = await cma.entry.get({ entryId: currentEntry.id });
      } else {
        entryData = await cma.entry.references({
          entryId: currentEntry.id,
          include: parseInt(selectValue),
        });
      }

      setEntry(entryData);
    };

    fetchEntry().catch(console.error);
  }, [cma.entry, currentEntry.id, sdk, selectValue]);

  return (
    <Stack flexDirection="column" alignItems="left">
      <Flex flexDirection="row" alignItems="space-between">
        <Box style={{ width: '100%' }}>
          <FormControl
            marginLeft="spacingL"
            marginTop="spacingL"
            marginBottom="none"
            style={{
              display: 'block',
              width: '300px',
            }}>
            <FormControl.Label>References include depth:</FormControl.Label>
            <Select
              id="includeDepth"
              name="includeDepth"
              value={selectValue}
              onChange={handleOnChange}>
              {
                // Create select options for values 0 through 10 to represent include depths.
                Array(11)
                  .fill(0)
                  .map((_, i) => (
                    <Select.Option key={i} value={String(i)}>
                      Include: {i}
                    </Select.Option>
                  ))
              }
            </Select>
          </FormControl>
        </Box>
        <CopyButton
          style={{ marginRight: '10px', marginTop: '10px' }}
          value={JSON.stringify(entry)}
        />
      </Flex>
      <Box marginLeft="spacingL">
        <ReactJson
          src={entry}
          displayDataTypes={configOptions.displayDataTypes === 'true'}
          iconStyle={configOptions.iconStyle}
          collapsed={configOptions.collapsed === 'true'}
          theme={configOptions.theme}
        />
      </Box>
    </Stack>
  );
};

export default Entry;
