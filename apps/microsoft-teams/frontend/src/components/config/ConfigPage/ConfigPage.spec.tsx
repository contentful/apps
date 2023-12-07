import ConfigPage from './ConfigPage';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { accessSection } from '@constants/configCopy';
import { mockSdk } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('ConfigPage component', () => {
  it('mounts and renders access section', () => {
    render(<ConfigPage />);

    expect(screen.getByText(accessSection.title)).toBeTruthy();
  });
});
