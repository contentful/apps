import { ChangeEvent, Dispatch, SetStateAction, useEffect } from 'react';
import { Box, FormControl, Select } from '@contentful/f36-components';
import { styles } from './ConfigScreen.styles';
import { AppInstallationParameters } from '../../types';
import { actions } from '../parameterReducer';
import { ConfigAppSDK } from '@contentful/app-sdk';

const ContentTypeSelect = ({
  parameters,
  dispatch,
  sdk,
}: {
  parameters: AppInstallationParameters;
  dispatch: Dispatch<SetStateAction<any>>;
  sdk: ConfigAppSDK;
}) => {
  const handleContentTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: actions.APPLY_SELECTED_CONTENT_TYPE,
      payload: event.target.value,
    });
  };

  const { selectedContentType, contentTypes } = parameters;

  return (
    <Box style={styles.selectSection.select}>
      <FormControl id="contentTypeSelect">
        <FormControl.Label>Content Types</FormControl.Label>
        <Select
          id="contentTypeSelect"
          name="contentTypeSelect"
          value={selectedContentType}
          onChange={handleContentTypeChange}>
          {contentTypes && contentTypes.length ? (
            <>
              <Select.Option value="" isDisabled>
                Please select a Content Type...
              </Select.Option>
              {contentTypes.map((contentType) => (
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
