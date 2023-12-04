import { render } from '@testing-library/react';
import { mockGetManyContentType } from '@test/mocks';
import { ContentTypeContext } from '@context/ContentTypeProvider';

const ContentTypeCustomRender = (component: React.ReactElement) => {
  return render(
    <ContentTypeContext.Provider
      value={{ contentTypes: mockGetManyContentType.items, contentTypeConfigLink: '' }}>
      {component}
    </ContentTypeContext.Provider>
  );
};

const ContentTypeCustomRerender = (
  component: React.ReactElement,
  rerender: (ui: React.ReactElement) => void
) => {
  return rerender(
    <ContentTypeContext.Provider
      value={{ contentTypes: mockGetManyContentType.items, contentTypeConfigLink: '' }}>
      {component}
    </ContentTypeContext.Provider>
  );
};

export { ContentTypeCustomRender, ContentTypeCustomRerender };
