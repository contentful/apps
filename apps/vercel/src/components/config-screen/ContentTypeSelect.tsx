import { ChangeEvent, Dispatch, SetStateAction, useEffect } from 'react';
import { Box, FormControl, Select } from '@contentful/f36-components';
import { styles } from './ConfigScreen.styles';
import { AppInstallationParameters } from '../../types';
import { actions } from '../parameterReducer';
import { ConfigAppSDK } from '@contentful/app-sdk';

const ContentTypeSelect = ({
  parameters,
  dispatch,
}: {
  parameters: AppInstallationParameters;
  dispatch: Dispatch<SetStateAction<any>>;
}) => {
  const handleContentTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: actions.APPLY_SELECTED_CONTENT_TYPE,
      payload: event.target.value,
    });
  };

  return (
    <Box style={styles.selectSection.select}>
      <FormControl id="contentTypeSelect">
        <FormControl.Label>Content Types</FormControl.Label>
        <Select
          id="contentTypeSelect"
          name="contentTypeSelect"
          value={parameters.selectedContentType}
          onChange={handleContentTypeChange}>
          {parameters.contentTypes && parameters.contentTypes.length ? (
            <>
              <Select.Option value="" isDisabled>
                Please select a Content Type...
              </Select.Option>
              {parameters.contentTypes.map((contentType) => (
                <Select.Option key={`option-${contentType.sys.id}`} value={contentType.sys.id}>
                  {contentType.name}
                </Select.Option>
              ))}
            </>
          ) : (
            <Select.Option value="">No Content Types currently configured.</Select.Option>
          )}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ContentTypeSelect;
