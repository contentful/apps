import React from 'react';
import { cleanup, render, configure } from '@testing-library/react';

import Sidebar from '../src/Sidebar';
import { ProjectType } from './constants';
import { vi } from 'vitest';

let LOCATION = 'entry-sidebar';
let PROJECT_ID = '123';
let VALID_FIELDS = true;

const mockUnsub = vi.fn();

function mockClient() {}

function mockSdk() {
  return {
    parameters: {
      installation: {
        optimizelyProjectId: PROJECT_ID,
        optimizelyProjectType: ProjectType.FeatureExperimentation,
      },
    },
    location: {
      is: vi.fn((l) => {
        return l === LOCATION;
      }),
    },
    window: {
      startAutoResizer: vi.fn(),
      stopAutoResizer: vi.fn(),
    },
    ids: {},
    space: {},
    locales: {},
    entry: {
      fields: {
        experimentId: {
          getValue: vi.fn(() => 'exp123'),
          onValueChanged: vi.fn(() => mockUnsub),
        },
        experimentKey: {
          getValue: vi.fn(() => 'exp123'),
          onValueChanged: vi.fn(() => mockUnsub),
        },
        environment: {
          getValue: vi.fn(() => 'production'),
          onValueChanged: vi.fn(() => mockUnsub),
        },
        flagKey: {
          getValue: vi.fn(() => 'flag123'),
          onValueChanged: vi.fn(() => mockUnsub),
        },
        revision: {
          getValue: vi.fn(() => 'random'),
          onValueChanged: vi.fn(() => mockUnsub),
        },
        meta: {
          getValue: vi.fn(),
          onValueChanged: vi.fn(() => vi.fn()),
        },
        variations: {
          getValue: vi.fn(),
          onValueChanged: vi.fn(() => vi.fn()),
        },
      },
    },
    contentType: {
      sys: {
        space: {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: 'cyu19ucaypb9',
          },
        },
        id: 'variationContainer',
        type: 'ContentType',
        createdAt: '2019-05-24T07:45:48.863Z',
        updatedAt: '2019-05-30T04:28:43.488Z',
        environment: {
          sys: {
            id: 'master',
            type: 'Link',
            linkType: 'Environment',
          },
        },
        revision: 3,
      },
      name: 'Variation Container',
      description: null,
      displayField: 'experimentTitle',
      fields: [
        {
          id: 'experimentTitle',
          name: 'Experiment title',
          type: 'Symbol',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
        },
        {
          id: 'experimentId',
          name: 'Experiment ID',
          type: 'Symbol',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
        },
        {
          id: 'meta',
          name: 'Meta',
          type: 'Object',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
        },
        {
          id: 'variations',
          name: 'Variations',
          type: 'Array',
          localized: false,
          required: false,
          validations: [],
          disabled: false,
          omitted: false,
          items: {
            type: 'Link',
            validations: [],
            linkType: 'Entry',
          },
        },
      ].concat(
        VALID_FIELDS
          ? {
              id: 'experimentKey',
              name: 'Experiment key',
              type: 'Symbol',
              localized: false,
              required: false,
              validations: [],
              disabled: false,
              omitted: false,
            }
          : []
      ),
    },
  };
}

configure({ testIdAttribute: 'data-test-id' });

describe('Sidebar', () => {
  afterEach(cleanup);

  it('should run all lifecycle methods', () => {
    const sdk = mockSdk();
    console.log({ sdk }, sdk.contentType.fields);
    const { unmount } = render(<Sidebar sdk={sdk} />);

    expect(sdk.window.startAutoResizer).toHaveBeenCalledTimes(1);

    expect(sdk.entry.fields.experimentKey.getValue).toHaveBeenCalledTimes(2);
    expect(sdk.entry.fields.revision.onValueChanged).toHaveBeenCalledTimes(1);
    expect(typeof sdk.entry.fields.revision.onValueChanged.mock.calls[0][0]).toEqual('function');

    unmount();

    expect(sdk.window.stopAutoResizer).toHaveBeenCalledTimes(1);
    expect(mockUnsub).toHaveBeenCalledTimes(1);
  });

  it('should use the project ID to create urls', () => {
    const sdk = mockSdk();
    // console.log({sdk}, sdk.contentType.fields.experimentKey.getValue())
    const { optimizelyProjectId, optimizelyProjectType } = sdk.parameters.installation;
    console.log({ optimizelyProjectType });

    const { getByTestId } = render(<Sidebar sdk={sdk} />);

    expect(getByTestId('view-experiment').href).toBe(
      'https://app.optimizely.com/v2/projects/123/flags/manage/flag123/rules/production/edit/exp123'
    );

    expect(getByTestId('view-all').href).toBe(
      'https://app.optimizely.com/v2/projects/123/flags/list?environment=production'
    );
  });
});
