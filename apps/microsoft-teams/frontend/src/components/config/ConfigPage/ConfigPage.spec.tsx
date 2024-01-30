import ConfigPage from './ConfigPage';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { mockSdk } from '@test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

vi.mock('@components/config/AccessSection/AccessSection', () => ({
  default: () => {
    return <div>Mock Access Section</div>;
  },
}));

vi.mock('@components/config/NotificationsSection/NotificationsSection', () => ({
  default: () => {
    return <div>Mock Notification Section</div>;
  },
}));

describe('ConfigPage component', () => {
  it('mounts and renders access section', () => {
    render(<ConfigPage />);

    expect(screen.getByText('Mock Access Section')).toBeTruthy();
  });
});
