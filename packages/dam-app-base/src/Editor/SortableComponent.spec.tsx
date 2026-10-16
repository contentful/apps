import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { SortableComponent } from './SortableComponent';
import { Asset, Config } from '../interfaces';

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
  }),
  verticalListSortingStrategy: jest.fn(),
}));

const makeThumbnail = (asset: Asset) => [asset.url, asset.filename] as [string, string | undefined];

const baseResource: Asset = {
  url: 'https://example.com/thumb.png',
  filename: 'hero.png',
};

describe('SortableComponent', () => {
  afterEach(cleanup);

  it('renders the filename from makeThumbnail alt text', () => {
    render(
      <SortableComponent
        disabled={false}
        onChange={jest.fn()}
        config={{} as Config}
        resources={[baseResource]}
        makeThumbnail={makeThumbnail}
        getAdditionalData={null}
      />
    );

    expect(screen.getByText('hero.png')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'hero.png' })).toBeTruthy();
  });

  it('renders a filename link when getAdditionalData provides href', () => {
    render(
      <SortableComponent
        disabled={false}
        onChange={jest.fn()}
        config={{} as Config}
        resources={[baseResource]}
        makeThumbnail={makeThumbnail}
        getAdditionalData={() => ({
          primary: 'hero.png',
          secondary: '1200 × 800',
          href: 'https://cdn.example.com/hero.png',
        })}
      />
    );

    const link = screen.getByRole('link', { name: 'hero.png' });
    expect(link.getAttribute('href')).toBe('https://cdn.example.com/hero.png');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(screen.getByText('1200 × 800')).toBeTruthy();
  });

  it('stops click propagation on filename links so drag listeners do not intercept', () => {
    const onCardClick = jest.fn();

    render(
      <div onClick={onCardClick}>
        <SortableComponent
          disabled={false}
          onChange={jest.fn()}
          config={{} as Config}
          resources={[baseResource]}
          makeThumbnail={makeThumbnail}
          getAdditionalData={() => ({
            primary: 'hero.png',
            href: 'https://cdn.example.com/hero.png',
          })}
        />
      </div>
    );

    fireEvent.click(screen.getByRole('link', { name: 'hero.png' }));

    expect(onCardClick).not.toHaveBeenCalled();
  });
});
