import { FieldAppSDK } from '@contentful/app-sdk';
import Field from './Field';
import { render } from '@testing-library/react';
import { AppParameters } from '../../interfaces';
import { vi } from 'vitest';

describe('Field', () => {
  it('should render', () => {
    const { container } = render(
      <Field
        {...{
          sdk: {
            window: {
              startAutoResizer: vi.fn(),
            },
            field: {
              type: 'Array',
              setValue: vi.fn(),
              removeValue: vi.fn(),
              onValueChanged: vi.fn(),
              onIsDisabledChanged: vi.fn(),
              getValue: vi.fn(),
              id: 'fieldId',
            },
            space: {
              sys: {
                id: 'spaceId',
              },
            },
            dialogs: {
              openCurrentApp: vi.fn(),
            },
            parameters: {
              installation: {},
            },
            cma: {},
            cmaAdapter: {},
          } as unknown as FieldAppSDK<AppParameters>,
        }}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should update state value', () => {
    const sdk = {
      field: {
        type: 'Array',
        getValue: vi.fn(() => {
          return ['sku1', 'sku2'];
        }),
        setValue: vi.fn((value) => {
          return value;
        }),
        removeValue: vi.fn(),
      },
    } as unknown as FieldAppSDK<AppParameters>;

    const field = new Field({ sdk });
    field.updateStateValue(['sku1', 'sku2']);
    expect(field.state.value).toEqual(['sku1', 'sku2']);
  });

  it('should open dialog', async () => {
    const sdk = {
      dialogs: {
        openCurrentApp: vi.fn(() => {
          return ['sku1', 'sku2'];
        }),
      },
      field: {
        type: 'Array',
        getValue: vi.fn(() => {
          return ['sku1', 'sku2'];
        }),
        setValue: vi.fn((value) => {
          return value;
        }),
        removeValue: vi.fn(),
      },
      parameters: {
        installation: {},
      },
    } as unknown as FieldAppSDK<AppParameters>;

    const field = new Field({ sdk });
    await field.onDialogOpen();
    expect(field.state.value).toEqual(['sku1', 'sku2']);
  });
});
