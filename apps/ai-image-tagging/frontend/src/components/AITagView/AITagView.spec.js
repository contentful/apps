import React from 'react';
import { cleanup, render, wait, configure, fireEvent } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import mockProps from '../../test/mockProps';
import { AITagView } from './AITagView';

const sdk = {
  ...mockProps.sdk,
  entry: {
    fields: {
      image: {
        getValue: jest.fn(),
        onValueChanged: jest.fn()
      },
      imageTags: {
        getValue: jest.fn(),
        setValue: jest.fn()
      }
    }
  },
  space: {
    getAsset: jest.fn()
  },
  notifier: {
    error: jest.fn()
  }
};

configure({ testIdAttribute: 'data-test-id' });

function renderComponent(sdk) {
  return render(<AITagView space={sdk.space} entries={sdk.entry.fields} locale='en-US' notifier={sdk.notifier} />)
}

describe('AITagView', () => {
  afterEach(cleanup);

  it('should disable everything if theres no image', async () => {
    const { getByTestId } = renderComponent(sdk);
    await wait();
    expect(getByTestId('cf-ui-button').disabled).toBeTruthy();
    expect(getByTestId('cf-ui-controlled-input').disabled).toBeTruthy();
    expect(getByTestId('image-tag').disabled).toBeTruthy();
  });

  it('should enable everything if theres an image', async () => {
    sdk.entry.fields.image.getValue.mockImplementation(() => ({
      sys: {
        id: '098dsjnwe9ds'
      }
    }));

    const { getByTestId } = renderComponent(sdk);
    await wait();
    expect(getByTestId('cf-ui-button').disabled).toBeFalsy();
    expect(getByTestId('cf-ui-controlled-input').disabled).toBeFalsy();
    expect(getByTestId('image-tag').disabled).toBeFalsy();
  });

  it('should render image tags if available', async () => {
    const tags = ['tag1', 'tag2'];
    sdk.entry.fields.image.getValue.mockImplementation(() => ({
      sys: {
        id: '098dsjnwe9ds'
      }
    }));
    sdk.entry.fields.imageTags.getValue.mockImplementation(() => tags);

    const { getAllByTestId } = renderComponent(sdk);
    await wait();
    expect(getAllByTestId('cf-ui-pill')).toHaveLength(tags.length);
  });

  it('should add image tags on Enter', async () => {
    sdk.entry.fields.image.getValue.mockImplementation(() => ({
      sys: {
        id: '098dsjnwe9ds'
      }
    }));
    sdk.entry.fields.imageTags.getValue.mockImplementation(() => []);

    const { getByTestId, getAllByTestId } = renderComponent(sdk);
    await wait();

    getByTestId('image-tag').value = 'new tag';
    fireEvent.keyPress(getByTestId('image-tag'), { key: 'Enter', keyCode: 13 });
    await wait();

    expect(getAllByTestId('cf-ui-pill')).toHaveLength(1);
  });

  describe('Calling AI Tags', () => {
    beforeEach(() => {
      const url = '//images.ctfassets.net/k3tebg1cbyuz/4dgP2U7BeMuk0icguS4qGw/59b8fe25285cdd1b5fcc69bd5555b3be/doge.jpeg';
      const expectedPath = '/k3tebg1cbyuz/4dgP2U7BeMuk0icguS4qGw/59b8fe25285cdd1b5fcc69bd5555b3be/doge.jpeg'

      sdk.entry.fields.image.getValue.mockImplementation(() => ({
        sys: {
          id: '098dsjnwe9ds'
        }
      }));
      sdk.space.getAsset.mockImplementation(() => ({
        fields: {file: { 'en-US': { url }}}
      }))
      sdk.entry.fields.imageTags.getValue.mockImplementation(() => []);
      fetchMock.get(`/tags/${expectedPath}`, {tags: ['ai-tag-1', 'ai-tag-2', 'ai-tag-3']})
    });

    afterEach(fetchMock.reset);

    it('should fetch tags and render them on btn click', async () => {
      const { getByTestId, getAllByTestId } = renderComponent(sdk);
      await wait();

      getByTestId('image-tag').value = 'new tag';
      fireEvent.click(getByTestId('cf-ui-button'));
      await wait();

      expect(getAllByTestId('cf-ui-pill')).toHaveLength(3);
    });

    it('should fetch tags and overwrite current ones', async () => {
      sdk.entry.fields.imageTags.getValue.mockImplementation(() => ['prior-tag']);
      const { getByTestId, getAllByTestId } = renderComponent(sdk);
      await wait();

      expect(getAllByTestId('cf-ui-pill')).toHaveLength(1);
      getByTestId('image-tag').value = 'new tag';
      fireEvent.click(getByTestId('cf-ui-button'));
      await wait();

      expect(getAllByTestId('cf-ui-pill')).toHaveLength(3);
    });

    it('should fetch tags and add them to current tags with overwrite option unchecked', async () => {
      sdk.entry.fields.imageTags.getValue.mockImplementation(() => ['prior-tag']);
      const { getByTestId, getAllByTestId } = renderComponent(sdk);
      await wait();

      expect(getAllByTestId('cf-ui-pill')).toHaveLength(1);
      getByTestId('image-tag').value = 'new tag';
      fireEvent.click(getByTestId('cf-ui-controlled-input'));
      fireEvent.click(getByTestId('cf-ui-button'));
      await wait();

      expect(getAllByTestId('cf-ui-pill')).toHaveLength(4);
    });
  });
});
