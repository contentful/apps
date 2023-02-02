import { useContext } from 'react';
import { render } from '@testing-library/react';
import { ApiContext, ApiProvider } from './ApiProvider';
import { mockCma, mockSdk } from '../../test/mocks';
import { Api } from '../services/api';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

const testFn = jest.fn((val) => val);
const TestComponent = () => {
  const { api } = useContext(ApiContext);
  testFn(api);
  return null;
};

describe('ApiProvider', () => {
  it('provides an Api instance to children', async () => {
    render(
      <ApiProvider>
        <TestComponent />
      </ApiProvider>
    );

    expect(testFn).toHaveBeenCalledWith(expect.any(Api));
  });
});
