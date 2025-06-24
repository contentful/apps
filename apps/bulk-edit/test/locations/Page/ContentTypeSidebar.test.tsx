import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContentTypeSidebar } from '../../../src/locations/Page/components/ContentTypeSidebar';
import { ContentTypeProps } from 'contentful-management';
import {
  condoAContentType,
  condoBContentType,
  condoCContentType,
} from '../../mocks/mockContentTypes';

const mockContentTypes: ContentTypeProps[] = [
  condoAContentType,
  condoBContentType,
  condoCContentType,
];

describe('ContentTypeSidebar', () => {
  it('renders sidebar with all content types', () => {
    render(
      <ContentTypeSidebar
        contentTypes={mockContentTypes}
        selectedContentTypeId="condo-a"
        onContentTypeSelect={() => {}}
      />
    );
    const nav = screen.getByTestId('content-types-nav');
    expect(nav).toBeTruthy();
    expect(screen.getByText('Condo A')).toBeTruthy();
    expect(screen.getByText('Condo B')).toBeTruthy();
    expect(screen.getByText('Condo C')).toBeTruthy();
  });

  it('sorts content types alphabetically in the sidebar', () => {
    render(
      <ContentTypeSidebar
        contentTypes={mockContentTypes}
        selectedContentTypeId="condo-a"
        onContentTypeSelect={() => {}}
      />
    );
    const items = screen.getAllByTestId('content-type-nav-item');
    const texts = items.map((el) => el.textContent);
    expect(texts).toEqual(['Condo A', 'Condo B', 'Condo C']);
  });

  it('calls onContentTypeSelect when a content type is clicked', () => {
    const onSelect = vi.fn();
    render(
      <ContentTypeSidebar
        contentTypes={mockContentTypes}
        selectedContentTypeId="condo-a"
        onContentTypeSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByText('Condo B'));
    expect(onSelect).toHaveBeenCalledWith('condoB');
  });
});
