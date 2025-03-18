import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Dialog from '../../src/locations/Dialog';
import React from 'react';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Dialog component', () => {
  it('Component text exists', () => {
    expect(true).toBeTruthy(); // TODO: replace
  });
});
