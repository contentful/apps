import { Dispatch, useEffect, useCallback, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK, AppState } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { ContentTypeReducer, ContentTypeAction } from '@components/config/contentTypeReducer';

/**
 * This hook is used to get all the content types for the space
 * It also gets the selected content types via the editor interface and dispatches to the reducer
 *
 * @returns allContentTypes
 */
const useGetContentTypes = (dispatch: Dispatch<ContentTypeReducer>) => {
  const [allContentTypes, setAllContentTypes] = useState<ContentTypeProps[]>([]);
  const sdk = useSDK<ConfigAppSDK>();

  const getAllContentTypes = useCallback(async () => {
    try {
      const contentTypesResponse = await sdk.cma.contentType.getMany({});
      setAllContentTypes(contentTypesResponse.items || []);
    } catch (error) {
      console.error(error);
    }
  }, [sdk.cma.contentType]);

  const getSelectedContentTypes = useCallback(async () => {
    try {
      const currentState: AppState | null = await sdk.app.getCurrentState();
      if (currentState !== null) {
        const { EditorInterface } = currentState;
        const selectedContentTypes = Object.keys(EditorInterface);

        dispatch({
          type: ContentTypeAction.ADD_ALL,
          value: selectedContentTypes,
        });
      } else {
        return;
      }
    } catch (error) {
      console.error(error);
    }
  }, [dispatch, sdk.app]);

  useEffect(() => {
    getAllContentTypes();
  }, [sdk, getAllContentTypes]);

  useEffect(() => {
    getSelectedContentTypes();
  }, [sdk, getSelectedContentTypes]);

  return allContentTypes;
};

export default useGetContentTypes;
