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
        if (currentSelection && contentType.sys.id === currentSelection) return true;
        return !contentTypePreviewPathSelections.some(
          (selection) => selection.contentType === contentType.sys.id
        );
      });

      return availableContentTypes;
    }
    return [];
  };
