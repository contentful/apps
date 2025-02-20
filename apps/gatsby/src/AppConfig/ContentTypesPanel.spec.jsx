import React from 'react';
import { ContentTypesSelection } from './ContentTypesPanel';
import { act, cleanup, render, waitFor } from '@testing-library/react';

describe('ContentTypesList', function () {
  let contentTypeId = 1;
  const environment = 'master';
  const space = '12512asfasf';
  const hostnames = {
    webapp: 'app.contentful.com',
  };

  const contentType = (name) => ({
    sys: { id: String(++contentTypeId) },
    name,
  });

  afterEach(cleanup);

  it('should show Skeleton on nil values', () => {
    const { container } = render(
      <ContentTypesSelection contentTypes={null} hostnames={hostnames} />
    );

    expect(container).toMatchSnapshot();
  });

  it('should show a Note if there are no content types', () => {
    const { container } = render(
      <ContentTypesSelection
        contentTypes={[]}
        space={space}
        environment={environment}
        hostnames={hostnames}
      />
    );

    expect(container).toMatchSnapshot();
  });

  it('should show options per content type', () => {
    const contentTypes = [contentType('posts'), contentType('authors')];
    const { queryByText } = render(
      <ContentTypesSelection
        contentTypes={contentTypes}
        enabledContentTypes={[]}
        space={space}
        environment={environment}
        hostnames={hostnames}
      />
    );

    expect(queryByText('posts')).toBeDefined();
    expect(queryByText('authors')).toBeDefined();
  });

  it('should show a select with the same value as the enabled content types', () => {
    const posts = contentType('posts');
    const authors = contentType('authors');
    const contentTypes = [posts, authors];
    const enabledTypes = [posts.sys.id];
    const { getByRole, queryByRole, queryAllByRole } = render(
      <ContentTypesSelection
        contentTypes={contentTypes}
        enabledContentTypes={enabledTypes}
        environment={environment}
        space={space}
        hostnames={hostnames}
      />
    );

    const select = queryByRole('combobox');
    const options = queryAllByRole('option');
    const postsOption = options.find((option) => option.label === 'posts');
    const authorsOption = options.find((option) => option.label === 'authors');

    expect(select.value === postsOption.value).toBe(true);
    expect(select.value === authorsOption.value).toBe(false);
  });
});
