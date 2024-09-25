import React from 'react';
import ConfigScreen from './ConfigScreen';
import { act, render, screen } from '@testing-library/react';
import { mockSdk } from './test-utils/mocksdk';

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    await act(async () => {
      render(<ConfigScreen sdk={mockSdk} />);
    });

    const element = screen.getByText(
      /The GraphQL Playground app enabled developers and content creators to write GraphQL queries right next to their content./
    );
    expect(element.hasAttribute('class')).toBe(true);
  });
});
