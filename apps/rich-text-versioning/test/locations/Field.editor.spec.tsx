import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import Field from '../../src/locations/Field';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => sdk,
  useAutoResizer: () => undefined,
}));

const subscribe = () => () => undefined;
const sdk = {
  field: {
    id: 'body',
    locale: 'en-US',
    validations: [],
    getValue: () => undefined,
    getIsDisabled: () => false,
    onValueChanged: subscribe,
    onIsDisabledChanged: subscribe,
    onSchemaErrorsChanged: subscribe,
  },
  entry: { getSys: () => ({ id: 'test-entry' }), onSysChanged: subscribe },
  ids: { space: 'test-space', environment: 'test-environment' },
  locales: { default: 'en-US', direction: { 'en-US': 'ltr' } },
  parameters: { instance: {} },
  space: { onEntityChanged: subscribe },
  navigator: {},
  cma: {},
};

it('renders an empty field with the installed rich-text editor', () => {
  // Keep the editor real: mocking it hides incompatible Slate dependencies.
  render(<Field />);

  expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'true');
});
