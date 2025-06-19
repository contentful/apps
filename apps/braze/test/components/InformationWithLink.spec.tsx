import { cleanup, render, RenderResult } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { queries } from '@testing-library/dom';
import InformationWithLink from '../../src/components/InformationWithLink';

describe('InformationWithLink component', () => {
  let infromationWithLinkComponent: RenderResult<typeof queries, HTMLElement, HTMLElement>;
  beforeEach(() => {
    infromationWithLinkComponent = render(
      <InformationWithLink url={'https://example.com'} linkText={'Learn more'} dataTestId="test-id">
        A random description.
      </InformationWithLink>
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the link correctly', () => {
    const brazeLink = infromationWithLinkComponent.getByTestId('link-test-id');

    expect(brazeLink).toBeTruthy();
    expect(brazeLink.closest('a')?.getAttribute('href')).toBe('https://example.com');
  });

  it('renders the text correctly', () => {
    const brazeParagraph = infromationWithLinkComponent.getByTestId('test-id');

    expect(brazeParagraph).toBeTruthy();
    expect(brazeParagraph.innerText).toBe('A random description. Learn more .');
  });

  it('renders the icon correctly', () => {
    const brazeLink = infromationWithLinkComponent.getByTestId('link-test-id');
    const icon = brazeLink.querySelector('svg');

    expect(icon).toBeTruthy();
  });
});
