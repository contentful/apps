import React from 'react';
import { ContentTypesList } from './ContentTypesPanel';
import { cleanup, render } from '@testing-library/react';

describe('ContentTypesList', function () {
  let contentTypeId = 1;
  const contentType = name => ({ sys: { id: String(++contentTypeId) }, name });
  const queryByInputName = name => (_, element) => element.tagName.toLowerCase() === 'input' && element.name === name;

  afterEach(cleanup);

  it('should show Skeleton on nil values', () => {
    const { container } = render(<ContentTypesList contentTypes={null}/>);

    expect(container).toMatchSnapshot();
  });

  it('should show a Note if there are no content types', () => {
    const { container } = render(<ContentTypesList contentTypes={[]}/>);

    expect(container).toMatchSnapshot();
  });

  it('should show checkboxes per content type', () => {
    const contentTypes = [
      contentType('posts'),
      contentType('authors'),
    ];
    const { queryByText } = render(<ContentTypesList contentTypes={contentTypes}
                                                     enabledContentTypes={[]}/>);

    expect(queryByText('posts')).toBeDefined();
    expect(queryByText('authors')).toBeDefined();
  });

  it('should check enabled content types', () => {
    const posts = contentType('posts');
    const authors = contentType('authors');
    const contentTypes = [posts, authors];
    const enabledTypes = [posts.sys.id];
    const { queryByText } = render(<ContentTypesList contentTypes={contentTypes}
                                                     enabledContentTypes={enabledTypes}/>);

    const postsElement = queryByText(queryByInputName('posts'));
    const authorsElement = queryByText(queryByInputName('authors'));

    expect(postsElement).toBeChecked();
    expect(authorsElement).not.toBeChecked();
  });
});
