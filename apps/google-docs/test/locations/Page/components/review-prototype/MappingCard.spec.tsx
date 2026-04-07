import { render, screen, within } from '@testing-library/react';
import React from 'react';
import tokens from '@contentful/f36-tokens';
import { describe, expect, it } from 'vitest';

import { MappingCard } from '../../../../../src/locations/Page/components/review-prototype/MappingCard';

describe('MappingCard', () => {
  it('renders compact mapping metadata rows', () => {
    render(
      <MappingCard
        card={{
          key: 'section-block-0-0-body',
          contentTypeName: 'Page',
          entryName: 'Example page',
          fieldName: 'Body',
        }}
      />
    );

    const card = screen.getByTestId('mapping-card-section-block-0-0-body');
    const contentTypeLabel = within(card).getByText('Content type');
    const pageValue = within(card).getByText('Page');

    expect(card).toHaveStyle({ backgroundColor: tokens.green100 });
    expect(card).toHaveStyle({ padding: tokens.spacing2Xs });
    expect(contentTypeLabel).toHaveStyle({
      fontSize: tokens.fontSizeS,
      lineHeight: tokens.lineHeightS,
    });
    expect(pageValue).toHaveStyle({
      fontSize: tokens.fontSizeM,
      lineHeight: tokens.lineHeightM,
    });
    expect(within(card).getByText('Entry name')).toBeTruthy();
    expect(within(card).getByText('Example page')).toBeTruthy();
    expect(within(card).getByText('Field')).toBeTruthy();
    expect(within(card).getByText('Body')).toBeTruthy();
  });
});
