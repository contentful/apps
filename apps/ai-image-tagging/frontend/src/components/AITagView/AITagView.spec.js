import React from 'react';
import { render, waitFor, configure, fireEvent } from '@testing-library/react';
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

  describe('if there is no image', () => {
    it('should disable everything', async () => {
      const appView = renderComponent(sdk);
      const { getByTestId, getByText } = appView;
      await waitFor(() => getByText('Auto-tag from AI'));
      expect(getByTestId('cf-ui-button').disabled).toBeTruthy();
      expect(getByTestId('cf-ui-controlled-input').disabled).toBeTruthy();
      expect(getByTestId('image-tag').disabled).toBeTruthy();
      expect(appView.container).toMatchSnapshot();
    });
  })

  describe('if there is an image', () => {
    beforeEach(() => {
      const imgData = {
        url: "//images.ctfassets.net/k3tebg1cbyuz/4dgP2U7BeMuk0icguS4qGw/59b8fe25285cdd1b5fcc69bd5555b3be/doge.png",
        contentType: 'image/png',
        details: { size: 200, height: 100, width: 100 }
      };
      sdk.space.getAsset.mockImplementation(() => ({
        fields: {file: { 'en-US': imgData }}
      }))

    })
    it('should enable everything', async () => {
      sdk.entry.fields.image.getValue.mockImplementation(() => ({
        sys: {
          id: '098dsjnwe9ds'
        }
      }));

      const { getByTestId, getByText, container } = renderComponent(sdk);
      await waitFor(() => getByText('Auto-tag from AI'));
      expect(getByTestId('cf-ui-button').disabled).toBeFalsy();
      expect(getByTestId('cf-ui-controlled-input').disabled).toBeFalsy();
      expect(getByTestId('image-tag').disabled).toBeFalsy();
      expect(container).toMatchSnapshot();
    });

    it('should render image tags if available', async () => {
      const tags = ['tag1', 'tag2'];
      sdk.entry.fields.image.getValue.mockImplementation(() => ({
        sys: {
          id: '098dsjnwe9ds'
        }
      }));
      sdk.entry.fields.imageTags.getValue.mockImplementation(() => tags);

      const { getAllByTestId, container } = renderComponent(sdk);
      await waitFor(() => expect(getAllByTestId('cf-ui-pill')).toHaveLength(tags.length));
      expect(container).toMatchSnapshot();
    });

    it('should add image tags on Enter', async () => {
      sdk.entry.fields.image.getValue.mockImplementation(() => ({
        sys: {
          id: '098dsjnwe9ds'
        }
      }));
      sdk.entry.fields.imageTags.getValue.mockImplementation(() => []);

      const appView = renderComponent(sdk);
      const { getByTestId, getAllByTestId } = appView;
      await waitFor(() => getByTestId('image-tag'));

      const tagInput = getByTestId('image-tag');
      fireEvent.change(tagInput, {target: { value: 'new tag'} });
      fireEvent.keyPress(tagInput, { key: 'Enter', keyCode: 13 });
      await waitFor(() => expect(getAllByTestId('cf-ui-pill')).toHaveLength(1));

      expect(appView.container).toMatchSnapshot();
    });

    it('should ignore duplicate image tags', async () => {
      sdk.entry.fields.image.getValue.mockImplementation(() => ({
        sys: {
          id: '098dsjnwe9ds'
        }
      }));
      sdk.entry.fields.imageTags.getValue.mockImplementation(() => ['tag1', 'tag2']);

      const appView = renderComponent(sdk);
      const { getByTestId, getAllByTestId } = appView;
      await waitFor(() => getByTestId('image-tag'));

      const tagInput = getByTestId('image-tag');
      fireEvent.change(tagInput, {target: { value: 'tag1'} });
      fireEvent.keyPress(tagInput, { key: 'Enter', keyCode: 13 });
      await waitFor(() => expect(getAllByTestId('cf-ui-pill')).toHaveLength(2));

      expect(appView.container).toMatchSnapshot();
    });
  })




  describe('Calling AI Tags', () => {
    beforeEach(() => {
      const imgData = {
        url: '//images.ctfassets.net/k3tebg1cbyuz/4dgP2U7BeMuk0icguS4qGw/59b8fe25285cdd1b5fcc69bd5555b3be/doge.jpeg',
        contentType: 'image/png',
        details: { size: 200, height: 100, width: 100 }
      };
      const expectedPath = '/k3tebg1cbyuz/4dgP2U7BeMuk0icguS4qGw/59b8fe25285cdd1b5fcc69bd5555b3be/doge.jpeg'

      sdk.entry.fields.image.getValue.mockImplementation(() => ({
        sys: {
          id: '098dsjnwe9ds'
        }
      }));
      sdk.space.getAsset.mockImplementation(() => ({
        fields: {file: { 'en-US': imgData }}
      }))
      sdk.entry.fields.imageTags.getValue.mockImplementation(() => []);
      fetchMock.get(`/tags/${expectedPath}`, {tags: ['ai-tag-1', 'ai-tag-2', 'ai-tag-3']})
    });

    afterEach(fetchMock.reset);

    it('should fetch tags and render them on btn click', async () => {
      const appView = renderComponent(sdk);
      const { getByTestId, getAllByTestId } = appView;
      await waitFor(() => getByTestId('image-tag'))

      getByTestId('image-tag').value = 'new tag';
      fireEvent.click(getByTestId('cf-ui-button'));

      await waitFor(() => expect(getAllByTestId('cf-ui-pill')).toHaveLength(3))

      expect(appView.container).toMatchSnapshot();
    });

    it('should fetch tags and overwrite current ones', async () => {
      sdk.entry.fields.imageTags.getValue.mockImplementation(() => ['prior-tag']);
      const appView = renderComponent(sdk);
      const { getByTestId, getAllByTestId } = appView;
      await waitFor(() => getAllByTestId('cf-ui-pill'))

      expect(getAllByTestId('cf-ui-pill')).toHaveLength(1);
      getByTestId('image-tag').value = 'new tag';
      fireEvent.click(getByTestId('cf-ui-button'));
      await waitFor(() => expect(getAllByTestId('cf-ui-pill')).toHaveLength(3))

      expect(appView.container).toMatchSnapshot();
    });

    it('should fetch tags and add them to current tags with overwrite option unchecked', async () => {
      sdk.entry.fields.imageTags.getValue.mockImplementation(() => ['prior-tag']);
      const appView = renderComponent(sdk);
      const { getByTestId, getAllByTestId } = appView;

      await waitFor(() => expect(getAllByTestId('cf-ui-pill')).toHaveLength(1));

      getByTestId('image-tag').value = 'new tag';
      fireEvent.click(getByTestId('cf-ui-controlled-input'));
      fireEvent.click(getByTestId('cf-ui-button'));

      await waitFor(() => expect(getAllByTestId('cf-ui-pill')).toHaveLength(4));

      expect(appView.container).toMatchSnapshot();
    });

    it('should disable btn if image type is unsupported', async () => {
      const imgData = {
        url: "//images.ctfassets.net/k3tebg1cbyuz/4dgP2U7BeMuk0icguS4qGw/59b8fe25285cdd1b5fcc69bd5555b3be/doge.gif",
        contentType: 'image/gif',
        details: { size: 200, height: 100, width: 100 }
      };
      sdk.space.getAsset.mockImplementation(() => ({
        fields: {file: { 'en-US': imgData }}
      }))
      const appView = renderComponent(sdk);
      const { getByTestId } = appView;
      await waitFor(() => expect(getByTestId('cf-ui-button').disabled).toBeTruthy());

      expect(getByTestId('cf-ui-note')).toBeTruthy();
      expect(appView.container).toMatchSnapshot();
    });

    it('should disable btn if image dimensions are invalid', async () => {
      const imgData = {
        url: "//images.ctfassets.net/k3tebg1cbyuz/4dgP2U7BeMuk0icguS4qGw/59b8fe25285cdd1b5fcc69bd5555b3be/doge.png",
        contentType: 'image/png',
        details: { size: 2000, height: 70, width: 200 }
      };
      sdk.space.getAsset.mockImplementation(() => ({
        fields: {file: { 'en-US': imgData }}
      }))
      const appView = renderComponent(sdk);
      const { getByTestId } = appView;

      await waitFor(() => expect(getByTestId('cf-ui-button').disabled).toBeTruthy());
      expect(getByTestId('cf-ui-note')).toBeTruthy();
      expect(appView.container).toMatchSnapshot();
    });

    it('should disable btn if image is too big', async () => {
      const imgData = {
        url: "//images.ctfassets.net/k3tebg1cbyuz/4dgP2U7BeMuk0icguS4qGw/59b8fe25285cdd1b5fcc69bd5555b3be/doge.png",
        contentType: 'image/png',
        details: { size: 6000000, height: 3000, width: 300 }
      };
      sdk.space.getAsset.mockImplementation(() => ({
        fields: {file: { 'en-US': imgData }}
      }))
      const appView = renderComponent(sdk);
      const { getByTestId } = appView;

      await waitFor(() => expect(getByTestId('cf-ui-button').disabled).toBeTruthy());
      expect(getByTestId('cf-ui-note')).toBeTruthy();
      expect(appView.container).toMatchSnapshot();
    });
  });
});
