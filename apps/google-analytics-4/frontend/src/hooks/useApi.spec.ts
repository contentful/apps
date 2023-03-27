import { render } from '@testing-library/react';
import React, { FunctionComponent } from 'react';
import { mockCma, mockSdk, validServiceKeyId } from '../../test/mocks';
import { Api } from '../apis/api';
import { useApi } from './useApi';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const testFn = jest.fn((val) => val);
const renderTestComponent = (componentFn: FunctionComponent) => {
  const TestComponent = componentFn;

  render(React.createElement(TestComponent));
};

describe('useApi', () => {
  it('provides an Api instance to children', () => {
    renderTestComponent(() => {
      const api = useApi(validServiceKeyId);
      testFn(api);
      return null;
    });
    expect(testFn).toHaveBeenCalledWith(expect.any(Api));
  });

  describe('when keys are not passed but they exist in sdk.parameters', () => {
    let originalParameters = mockCma.parameters;

    beforeEach(() => {
      mockSdk.parameters.installation = {
        serviceAccountKeyId: validServiceKeyId,
      };
    });

    afterEach(() => {
      mockSdk.parameters = originalParameters;
    });

    it('provides an Api instance to children', () => {
      renderTestComponent(() => {
        const api = useApi();
        testFn(api);
        return null;
      });
      expect(testFn).toHaveBeenCalledWith(expect.any(Api));
    });
  });
});
