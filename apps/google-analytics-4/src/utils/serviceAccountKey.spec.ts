import { validServiceKeyFile } from '../../test/mocks';
import { AssertionError, convertKeyFileToServiceAccountKey } from './serviceAccountKey';

describe('convertKeyFileToServiceAccountKey', () => {
  it('converts a valid key file (string) to a service key', () => {
    const keyFile = JSON.stringify(validServiceKeyFile);
    const result = convertKeyFileToServiceAccountKey(keyFile);

    expect(result).toEqual(expect.objectContaining(validServiceKeyFile));
  });

  it('throws an AssertionError when `type` is wrong', () => {
    const keyFile = JSON.stringify({ ...validServiceKeyFile, type: 'foo' });

    expect(() => {
      convertKeyFileToServiceAccountKey(keyFile);
    }).toThrow(AssertionError);
  });

  it('throws an AssertionError when required keys are missing', () => {
    const { private_key_id: _, ...keyFileMissingPrivateKeyId } = validServiceKeyFile;
    const keyFile = JSON.stringify(keyFileMissingPrivateKeyId);

    expect(() => {
      convertKeyFileToServiceAccountKey(keyFile);
    }).toThrow(/Key file is missing the following keys/);
  });

  it('throws an AssertionError when a key is not a string', () => {
    const keyFile = JSON.stringify({ ...validServiceKeyFile, private_key_id: 4 });

    expect(() => {
      convertKeyFileToServiceAccountKey(keyFile);
    }).toThrow(/Key file has invalid values/);
  });
});
