import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, MockSdk } from '@test/mocks';
import Selector from './Selector';

const mockSdk = new MockSdk();
const sdk = mockSdk.sdk;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

const options = [
  <option key="1" value="dog" data-testid="Dog">
    Dog
  </option>,
  <option key="2" value="cat" data-testid="Cat">
    Cat
  </option>,
];

describe('Selector', () => {
  it('renders', () => {
    const { getByText, unmount } = render(
      <Selector title="Title" selectedValue="dog" options={options} onChange={() => {}} />
    );
    expect(getByText('Title')).toBeTruthy();
    unmount();
  });

  it('Rerenders selector with new options', () => {
    const { rerender, getByTestId, unmount } = render(
      <Selector title="Title" selectedValue="dog" options={options} onChange={() => {}} />
    );
    expect(getByTestId('Dog')).toBeTruthy();
    rerender(
      <Selector
        title="Title"
        selectedValue="lizard"
        options={[<option key="1" value="lizard" data-testid="NewAnimal" />]}
        onChange={() => {}}
      />
    );
    expect(getByTestId('NewAnimal')).toBeTruthy();
    unmount();
  });

  it('Rerenders selector with new selected value', () => {
    const { rerender, getByTestId, unmount } = render(
      <Selector title="Title" selectedValue="dog" options={options} onChange={() => {}} />
    );
    expect(getByTestId('Dog')).toBeTruthy();
    rerender(<Selector title="Title" selectedValue="cat" options={options} onChange={() => {}} />);
    expect(getByTestId('Cat')).toBeTruthy();
    unmount();
  });
});
