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
});
