// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';

configure({
  testIdAttribute: 'data-test-id',
});

// Minimal ResizeObserver shim for jsdom environment used in tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error assign to global for tests
global.ResizeObserver = ResizeObserver;

// Lightweight mock for react-window Grid to avoid ResizeObserver/RAF churn in tests
vi.mock('react-window', () => {
  function Grid({
    cellComponent: Cell,
    cellProps,
    columnCount,
    rowCount,
    columnWidth,
    rowHeight,
    style,
  }: any) {
    const items: React.ReactNode[] = [];
    const maxRender = 30; // cap to keep tests fast
    let rendered = 0;
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < columnCount; col++) {
        if (rendered >= maxRender) break;
        items.push(
          React.createElement(
            'div',
            {
              key: `${row}-${col}`,
              style: { width: columnWidth, height: rowHeight },
            },
            React.createElement(Cell, {
              columnIndex: col,
              rowIndex: row,
              style: { width: columnWidth, height: rowHeight },
              ariaAttributes: {},
              ...cellProps,
            })
          )
        );
        rendered += 1;
      }
      if (rendered >= maxRender) break;
    }
    return React.createElement('div', { 'data-testid': 'mock-grid', style }, items);
  }

  return { Grid };
});
