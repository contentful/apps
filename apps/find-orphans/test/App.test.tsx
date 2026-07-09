import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from '../src/App';

const mocks = vi.hoisted(() => ({
  sdk: {
    location: { is: vi.fn().mockReturnValue(false) },
  },
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mocks.sdk,
}));

describe('App', () => {
  it('renders nothing when the location is not recognized', () => {
    const { container } = render(<App />);
    expect(container).toBeEmptyDOMElement();
  });
});
