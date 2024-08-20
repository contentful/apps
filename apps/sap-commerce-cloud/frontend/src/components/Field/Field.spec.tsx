import { FieldAppSDK } from '@contentful/app-sdk';
import Field from './Field';
import { render } from '@testing-library/react';
import { AppParameters } from '../../interfaces';
import { makeSdkMock } from '../../__mocks__';
const sdk = makeSdkMock() as unknown as FieldAppSDK<AppParameters>;

describe('Field', () => {
  it('should render', () => {
    const { container } = render(
      <Field
        {...{
          sdk,
        }}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should update state value', () => {
    const field = new Field({ sdk });
    field.updateStateValue(['sku1', 'sku2']);
    expect(sdk.field.setValue).toHaveBeenCalledWith(['sku1', 'sku2']);
  });

  it('should open dialog', async () => {
    const field = new Field({ sdk });
    await field.onDialogOpen();
    expect(sdk.field.getValue).toHaveBeenCalled();
  });
});
