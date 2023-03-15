import {
  mockContentTypeItems,
  mockAllContentTypesIncomplete,
  mockAllContentTypesComplete,
  mockContentTypes,
  mockEditorInterfaceComplete,
  mockEditorInterfaceIncomplete,
} from '../../test/mocks';
import {
  assignAppToContentTypeSidebar,
  syncContentTypes,
  sortAndFormatContentTypes,
} from './contentTypes';

describe('contentTypes utils', () => {
  it('assigns the app to the content type sidebar', () => {
    const result = assignAppToContentTypeSidebar(['course'], 2);

    expect(result).toEqual(expect.objectContaining({ course: { sidebar: { position: 2 } } }));
  });

  it('removes content types when the app has been removed from the sidebar a content type', () => {
    const result = syncContentTypes(
      mockContentTypes,
      mockAllContentTypesComplete,
      mockEditorInterfaceIncomplete
    );
    const contentTypeIds = Object.keys(result);

    expect(contentTypeIds.length).toEqual(2);
    expect(result.layout).toBeUndefined();
  });

  it('removes content types when the content type or its fields have been deleted', () => {
    const result = syncContentTypes(
      mockContentTypes,
      mockAllContentTypesIncomplete,
      mockEditorInterfaceComplete
    );
    const contentTypeIds = Object.keys(result);

    expect(contentTypeIds.length).toEqual(1);
    expect(result.course).toBeUndefined();
    expect(result.category).toBeUndefined();
  });

  it('sorts and formats content types', () => {
    const result = sortAndFormatContentTypes(mockContentTypeItems);
    const fields = result['layout'].fields;

    expect(Object.keys(result).length).toEqual(1);
    expect(fields.length).toEqual(2);
    expect(fields[0].id).toEqual('slug');
  });
});
