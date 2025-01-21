import { AppState, ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import {
  ContentTypesWithEditorInterface,
  SelectedContentTypes,
} from '../components/AddToSidebarSection';

/**
 * This hook is used to save the parameters of the app.
 *
 * @param parameters the parameters to be saved
 * @param contentTypes the content types to be saved
 * @returns void
 */
const useGetAllContentTypes = () => {
  const [allContentTypes, setAllContentTypes] = useState<ContentTypesWithEditorInterface[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<SelectedContentTypes>({});
  const [isLoading, setIsLoading] = useState(false);
  const sdk = useSDK<ConfigAppSDK>();

  const getAllContentTypes = useCallback(async () => {
    try {
      setIsLoading(true);
      const contentTypesResponse = await sdk.cma.contentType.getMany({});
      const sortedContentTypes = contentTypesResponse.items?.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setAllContentTypes(sortedContentTypes || []);
      const currentState: AppState | null = await sdk.app.getCurrentState();
      if (currentState) {
        const { EditorInterface } = currentState;
        const selectedContentTypes = Object.keys(EditorInterface);
        const editorInterfaceCopy = {} as unknown as SelectedContentTypes;
        selectedContentTypes.forEach((contentType) => {
          editorInterfaceCopy[contentType] =
            EditorInterface[contentType].sidebar?.settings?.contentTypeColor;
        });
        setSelectedContentTypes(editorInterfaceCopy);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  useEffect(() => {
    getAllContentTypes();
  }, [getAllContentTypes]);

  return { allContentTypes, selectedContentTypes, setSelectedContentTypes, isLoading };
};

export default useGetAllContentTypes;
