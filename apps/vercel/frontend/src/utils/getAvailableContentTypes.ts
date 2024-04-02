import { ContentType } from '@contentful/app-sdk';
import { ContentTypePreviewPathSelection } from '@customTypes/configPage';

export const getAvailableContentTypes =
  (
    contentTypes: ContentType[],
    contentTypePreviewPathSelections: ContentTypePreviewPathSelection[]
  ) =>
  (currentSelection?: string) => {
    if (contentTypes.length) {
      const availableContentTypes = contentTypes.filter((contentType) => {
        const currentSelectionExists = currentSelection && contentType.sys.id === currentSelection;
        return (
          currentSelectionExists ||
          !contentTypePreviewPathSelections.some(
            (selection) => selection.contentType === contentType.sys.id
          )
        );
      });

      return availableContentTypes;
    }
    return [];
  };
