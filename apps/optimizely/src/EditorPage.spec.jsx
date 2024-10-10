import React from 'react';
import { render, waitFor, configure } from '@testing-library/react';

import mockProps from './mockProps';
import mockVariantData from './mockData/mockVariantData';

import EditorPage from '../src/EditorPage';
import { expect, vi } from 'vitest';

configure({ testIdAttribute: 'data-test-id' });

describe('EditorPage', () => {
  let sdk;
  beforeEach(() => {
    sdk = mockProps.sdk;
    sdk.entry.fields.experimentId.onValueChanged = (fn) => () => {};

    Date.now = vi.fn(() => 100);
    Math.random = vi.fn(() => 0.5);
  });

  it('should show the reauth modal when no client is available', () => {
    const { getByTestId } = render(<EditorPage sdk={sdk} />);

    expect(getByTestId('reconnect-optimizely')).toBeDefined();
  });

  it('should show the preemtive reconnect warning box', () => {
    const expires = (Date.now() + 50000).toString();
    const { getByTestId } = render(<EditorPage sdk={sdk} client={() => {}} expires={expires} />);

    expect(getByTestId('preemptive-connect')).toBeDefined();
  });

  it('should show the experiment data when loaded', async () => {
    const space = {
      getContentTypes: () => Promise.resolve(mockVariantData.contentTypes),
      getEntries: () => Promise.resolve(mockVariantData.entries),
    };

    let valueChange = null;

    sdk = { ...sdk, space };

    sdk.entry.fields.experimentTitle.setValue = vi.fn();
    sdk.entry.fields.experimentKey.onValueChanged = (fn) => {
      valueChange = fn;
      return () => {};
    };

    const client = {
      getProject: () => Promise.resolve(mockVariantData.project),
      getProjectEnvironments: () => Promise.resolve(mockVariantData.environments),
      getExperiments: () => Promise.resolve(mockVariantData.experiments),
      getResultsUrl: (campaignUrl, experimentId) => {
        return `https://app.optimizely.com/v2/projects/123/results/${campaignUrl}/experiments/${experimentId}`;
      },
      getExperimentResults: () => Promise.resolve(mockVariantData.results),
    };

    const expires = (Date.now + 10000000).toString();
    const { container } = render(
      <EditorPage sdk={sdk} expires={expires} client={client} openAuth={() => {}} />
    );

    await waitFor(() => valueChange('landing-page-hero'));
    await waitFor(() => expect(container));
  });
});
