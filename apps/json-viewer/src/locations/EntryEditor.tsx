import React, { useEffect, useState } from 'react';
import { EditorExtensionSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { Box, FormControl, Select, Stack } from '@contentful/f36-components';
import ReactJson from 'react-json-view';

const Entry = () => {
  const sdk = useSDK<EditorExtensionSDK>();
  const cma = useCMA();
  const currentEntry = sdk.entry.getSys();
  const [entry, setEntry] = useState({});
  const [selectValue, setSelectValue] = useState('0');
  const handleOnChange = (event: any) => setSelectValue(event.target.value);
  // Get the viewer options set in app config.
  const { configOptions } = sdk.parameters.installation;

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
      <FormControl
        marginLeft="spacingL"
        marginTop="spacingL"
        marginBottom="spacingS"
        style={{
          display: 'block',
          width: '200px',
        }}>
        <FormControl.Label>References include depth:</FormControl.Label>
        <Select id="includeDepth" name="includeDepth" value={selectValue} onChange={handleOnChange}>
          {
            // Create select options for values 0 through 10 to represent include depths.
            Array(11)
              .fill(0)
              .map((_, i) => (
                <Select.Option key={i} value={i}>
                  Include: {i}
                </Select.Option>
              ))
          }
        </Select>
      </FormControl>
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
