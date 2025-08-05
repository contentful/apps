import React from 'react';
import {
  Box,
  Heading,
} from '@contentful/f36-components';
import {
  useSDK,
} from '@contentful/react-apps-toolkit';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import jsonConfigFileInCodebase from '../config/vsea.json';

const Entry = () => {
  const sdk = useSDK();
  const locale = sdk.locales.default;
  const locales = sdk.locales;
  const contentTypeId = sdk.contentType.sys.id;

  const jsonConfig = jsonConfigFileInCodebase;
  const contentTypeConfig = jsonConfig[contentTypeId];

  return <Box>
    {Object.keys(contentTypeConfig).map(key => {

      const newFieldName = contentTypeConfig[key];

      return <div key={Math.random()}>
        <Heading marginTop='spacingS'>{newFieldName}</Heading>
        <SingleLineEditor
          field={sdk.entry.fields[key].getForLocale(locale)}
          locales={locales}
          currentLocale={locale}
        />
      </div>
    })}

  </Box>;
};

export default Entry;
