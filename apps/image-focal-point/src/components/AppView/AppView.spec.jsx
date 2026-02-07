import React from 'react';
import { vi } from 'vitest';
import { cleanup, render, wait, configure, fireEvent } from '@testing-library/react';

import mockProps from '../../test/mockProps';
import { AppView } from './AppView';

configure({ testIdAttribute: 'data-test-id' });

describe('AppView', () => {
  let props;
  beforeEach(() => {
    props = {
      sdk: {
        ...mockProps.sdk,
        space: {
          getContentTypes: vi.fn(() => ({
            items: [],
          })),
        },
        app: {
          setReady: vi.fn(),
          isInstalled: vi.fn(),
          onConfigure: vi.fn(),
          onConfigurationCompleted: vi.fn(),
        },
      },
    };
  });

  describe('when the app is not installed', () => {
    beforeEach(() => props.sdk.app.isInstalled.mockImplementation(() => Promise.resolve(false)));

    it('should render the app view with installation screen', async () => {
      const appView = render(<AppView {...props} />);
      await wait();
      expect(appView.container).toBeDefined();
    });

    it('should render inline validation if the content type id is taken', async () => {
      props.sdk.space.getContentTypes.mockImplementation(() => ({
        items: [{ sys: { id: 'imageWithFocalPoint' }, name: 'Test', fields: [] }],
      }));
      const { getByTestId } = render(<AppView {...props} />);
      await wait();
      expect(getByTestId('content-type-name')).toBeDefined();
      expect(getByTestId('content-type-id')).toBeDefined();
    });

    it('should update the content type id field if it is pristine and the content type name is changed', async () => {
      const { getByTestId } = render(<AppView {...props} />);
      await wait();
      fireEvent.change(getByTestId('content-type-name-input'), { target: { value: 'Test Name' } });
      expect(getByTestId('content-type-id-input').value).toEqual('testName');
    });

    it('should not update the content type id field if it is dirty and the content type name is changed', async () => {
      const { getByTestId } = render(<AppView {...props} />);
      await wait();
      fireEvent.change(getByTestId('content-type-id-input'), { target: { value: 'someTestId' } });
      fireEvent.change(getByTestId('content-type-name-input'), { target: { value: 'Test Name' } });
      expect(getByTestId('content-type-id-input').value).toEqual('someTestId');
    });

    it('should allow selecting an existing content type with Object and Asset fields', async () => {
      props.sdk.space.getContentTypes.mockImplementation(() => ({
        items: [
          {
            sys: { id: 'eligibleType' },
            name: 'Eligible Type',
            fields: [
              { id: 'focalPoint', name: 'Focal Point', type: 'Object' },
              { id: 'image', name: 'Image', type: 'Link', linkType: 'Asset' },
            ],
          },
        ],
      }));
      const { getByLabelText, getByTestId } = render(<AppView {...props} />);
      await wait();

      // Switch to "Use existing" mode
      fireEvent.click(getByLabelText('Use an existing content type'));

      // Should show the existing content type dropdown
      expect(getByTestId('existing-content-type')).toBeDefined();
    });

    it('should show field dropdowns when existing content type is selected', async () => {
      props.sdk.space.getContentTypes.mockImplementation(() => ({
        items: [
          {
            sys: { id: 'eligibleType' },
            name: 'Eligible Type',
            fields: [
              { id: 'focalPoint', name: 'Focal Point', type: 'Object' },
              { id: 'image', name: 'Image', type: 'Link', linkType: 'Asset' },
            ],
          },
        ],
      }));
      const { getByLabelText, getByTestId, container } = render(<AppView {...props} />);
      await wait();

      // Switch to "Use existing" mode
      fireEvent.click(getByLabelText('Use an existing content type'));

      // Select the content type
      const select = container.querySelector('select[name="existingContentType"]');
      fireEvent.change(select, { target: { value: 'eligibleType' } });

      // Should show field dropdowns
      expect(getByTestId('focal-point-field')).toBeDefined();
      expect(getByTestId('image-field')).toBeDefined();
    });
  });

  describe('when the app is installed', () => {
    it('should render the app view with configuration screen', async () => {
      props.sdk.app.isInstalled.mockImplementation(() => true);
      const appView = render(<AppView {...props} />);
      await wait();
      expect(appView.container).toBeDefined();
    });
  });
});
