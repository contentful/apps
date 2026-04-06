import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyDialogSizing,
  createDialogOptions,
  DIALOG_MIN_HEIGHT,
  DIALOG_WIDTH,
} from './dialogSizing.js';

test('createDialogOptions requests a fixed desktop-width dialog for the asset picker', () => {
  const config = { bf_api_key: 'test-key' };

  assert.deepEqual(createDialogOptions('Select an asset on Brandfolder', config), {
    position: 'center',
    title: 'Select an asset on Brandfolder',
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEscapePress: true,
    parameters: config,
    width: DIALOG_WIDTH,
    minHeight: DIALOG_MIN_HEIGHT,
    allowHeightOverflow: true,
  });
});

test('applyDialogSizing stretches the embedded iframe to the available dialog size', () => {
  const container = { style: {} };
  const iframe = { style: {} };

  applyDialogSizing(container, iframe);

  assert.deepEqual(container.style, {
    width: '100%',
    height: DIALOG_MIN_HEIGHT,
  });
  assert.deepEqual(iframe.style, {
    width: '100%',
    height: '100%',
    display: 'block',
    border: 'none',
  });
});
