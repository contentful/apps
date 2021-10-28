/* eslint-disable @typescript-eslint/no-explicit-any */

import Adapter from 'enzyme-adapter-react-16';
// import nock from 'nock';
import 'isomorphic-fetch';

import * as React from 'react';
import { mount, shallow, configure } from 'enzyme';

import { App } from './';

configure({ adapter: new Adapter() });

/*
 * This was a valid private key, but it has since been revoked
 */
const keyPrivate =
  'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBNDZmMGl2MUdZV3VCNHpCNkZjTG9KcW05S1l0eXVBdEZ4WEZ2Q0h5MWc0OVNBNnhICnI2TzJjS1IrRmd0MlZkckxWbmc1UkdtdE5qNEd2WllMT2k4RWJ6dzBMeE9UaWtvK2xKZmVGMS95SC82Ymh2dnQKd3d4L1R4Z3RoQnpUUHp3Ry9oRjVHbGZQeXRheC91emNSN3dFY1JRUUhHeENHcUJ1ZXFZUk5GRGFnVEFJTmJOVwpJK2tkV0hZVG5lSldJTXhNb0UwLzBxOUYvN1ZCY2pibHhDLzdjeXNGUjNvbUdRR1JDejZsSzJxOFlIVGtiQm1tCk1uYnRBeEtkcElqTDljOTJERmhDdDN6ZXhGY0JadDhzMlg5UUQ4N2FBWEhvVkNDRzVMWFZNMUlaQWNzWmt5N2kKVEhLcVVVbXNJekhDdGZRKzhnQ3RGbm1DNkQrT2RHTk9ieDdoMndJREFRQUJBb0lCQUFyOXBOVEEvWkRlZTlyWQpFRXpVcUJpVndVZ3NMMUdyV2FiNm52MnQ1NlYrV2R0TGlmcDAwTzRIUXY4VmRwVVdoeEtabzBvbVAvS0tkQkRiCkdaZXBoWEZKV3N1YkNsaDIxU2FmWGwyS2lFbjdKTThUZ3BzVUUyRmlMWEJmWStOOXBtakZ0eThLWmtISXM3YzMKQUR1R1hFQ0pVMjNMM0RVazRiQ1NLK3Ayck5YbndHNHA5MDlGbkZiczRpTDl6a1hWK292bkhwQnZSYXJQRGFGZApZT0M1M3ZlekVHbHNuQU9tTnUxUitDZEZMWTZDY0grenNrU3ZXSjFGUVIvUUJ3Q0Q5UmpsS085bm4xb3BLWlJnCkxwdW1tSlFRRzNCNjhvendqenhPSnBFU3hRa0w3WVVoV1V4dFlQR0lQdmI2bm1xZVA1aUxLWXd4djhGZXlYN3cKaGZRWVhLRUNnWUVBOHhDSHl2Zm9mZlRRU1pIM3dYUWg4c2dmQUNwNlhCZ1pFWXhETkJFcHppUmx6RnZqOUlPNwp1MWtWN3pFNDE0dXRMWFRrYklSVmNpRkR3aVZ1NlkwK0lYT0lYbDRscUhjZHJBWmhiQnAxeDV3MnJjbEhXNmtICjZvM2ZqSGJKVHFMMXI2b25yUUVQSXRpQkVQMUN6Q013dnZ3WG9KcnJ2NUdieXg4bW1BVkI3ZFVDZ1lFQTc4V0EKaXIrQ0hFVnpOeCtwd0JKRXNsNnVOZnZoa1dIaldrTHF4ajMzbzA5QTJCeXlqc1ZRb1UzQi8xZnhiQ05zMmhHNwpEYUpaWFdGK3VXMklCS3VsUkFXeVN1WEJkNGhvbXlpdXRIWWUzL0Z2YnlwaFVyN3BCWFBhUWxPUkNOa1hqV3pYCmI3clVDNXIrU2t6M1E5TEtjTmppRlVYaTRucXVpUEFaQ2krK2VPOENnWUVBdmRmVVo5ZjNNNkdwcVR5ajZPbisKdGZST0drQVRMNmoyczNqODZFYmJneEYwblFmTVpLY2JVcm5DNHY1cjZoWkRIWFRtRUVmUHdRTndPOHdtODYySQpzSEhmT2UySXRpcks5eGhJc1RsOWNubDFUNGtjL2Q5b3VtOHpBaStwRFkxRUhYN2wzRDh1aGtYWmtONXVkS2lyCm93K2NtS2xIcG1sZzZHWWRLN0UzakQwQ2dZRUFyK2xFLzRhMW5LeFBkWGZqZ0tsbWdUNzVyVjJaQnFLOHZMSXYKc1RZeGd6MVlJN1lhUXFqOUdQc0ZnNk12MnRpNnVkc2NVMHB6S2hHbmViK2tkVmpCTFlESWFDN2NuQ2dXSncvWAo3VXBrS0lUbjdyVTNKaEF1d2ZOWGhDWHZXSUI5eVNLN2hKdWJpdEF5RkswWEZFbUlnUForR0lGbmppWFgrMXU3CjR6OVlEVDBDZ1lCWHBGZ2hWMnpEWW9SeExFQXQ4SUxhOXh5S1RBQmhGbDl2a1Y1TzBzQUVQd0xZSkJXS2YyTTQKOVNxZ3I3Q0JMeEN6U1NMejFWZXMyUFZCUytnR2JJYUFtQWpXbGU4bTF0ejc3MWtFMDhQdGdzOWhuT09wMy9DYwozOGt3dnJoM250YkNDbjk2MldjaEs1aHdLREU4UXd6OXhPU2JSdEpDWWhDVkJzczc5Y2Q1b2c9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo=';

const SDK_MOCK = {
  parameters: {
    installation: {
      muxAccessTokenId: 'abcd1234',
      muxAccessTokenSecret: 'efgh5678',
    },
  },
  field: {
    getValue: () => ({}),
    onValueChanged: () => ({}),
    setValue: () => ({}),
  },
  window: {
    startAutoResizer: () => {},
  },
};

const SDK_MOCK_WITH_SIGNED_URLS = {
  ...SDK_MOCK,
  ...{
    parameters: {
      installation: {
        muxAccessTokenId: 'abcd1234',
        muxAccessTokenSecret: 'efgh5678',
        muxSigningKeyId: 'signing-key-id',
        muxSigningKeyPrivate: keyPrivate,
        muxEnableSignedUrls: true,
      },
    },
  },
};

test('throws an error if required installation parameters are not configured', () => {
  const mockedSdk = {
    ...SDK_MOCK,
    parameters: {
      installation: {
        muxAccessTokenId: undefined,
        muxAccessTokenSecret: undefined,
      },
    },
  };

  const wrapper = mount(<App sdk={mockedSdk as any} />);
  expect(wrapper.state('error')).toContain('Mux Access Token ID or Secret');
  expect(wrapper.find('Note').text()).toContain('Access Token ID');
});

test('displays an upload form before the user does anything', () => {
  const mockedSdk = { ...SDK_MOCK };

  const wrapper = mount(<App sdk={mockedSdk as any} />);
  expect(wrapper.find('input').prop('type')).toBe('file');
});

test('displays a player when the state has a playbackUrl and posterUrl', async () => {
  const mockedSdk = {
    ...SDK_MOCK,
    field: {
      ...SDK_MOCK.field,
      getValue: () => ({
        ready: true,
        assetId: 'test-assetId123',
        playbackId: 'test-playbackId123',
      }),
    },
  };

  const wrapper = await shallow(<App sdk={mockedSdk as any} />);
  wrapper.instance().forceUpdate();
  await (wrapper.instance() as App).setPublicPlayback('test-playbackId123');
  expect(wrapper.state('playbackUrl')).toEqual('https://stream.mux.com/test-playbackId123.m3u8');
  expect(wrapper.state('posterUrl')).toEqual(
    'https://image.mux.com/test-playbackId123/thumbnail.jpg'
  );
  expect(wrapper.find('Player')).toHaveLength(1);
});

test('displays a player when the state has a signed playbackUrl and signed posterUrl', async () => {
  const mockedSdk = {
    ...SDK_MOCK_WITH_SIGNED_URLS,
    field: {
      ...SDK_MOCK_WITH_SIGNED_URLS.field,
      getValue: () => ({
        ready: true,
        assetId: 'test-assetId123',
        playbackId: 'test-playbackId123',
      }),
    },
  };

  const wrapper = await shallow(<App sdk={mockedSdk as any} />);
  wrapper.instance().forceUpdate();
  await (wrapper.instance() as App).setSignedPlayback('test-playbackId123');
  expect(wrapper.state('playbackUrl')).toMatch(
    'https://stream.mux.com/test-playbackId123.m3u8?token='
  );
  expect(wrapper.state('posterUrl')).toMatch(
    'https://image.mux.com/test-playbackId123/thumbnail.jpg?token='
  );
  expect(wrapper.find('Player')).toHaveLength(1);
});

test('displays an error when we have a signed playbackId but no signing keys', async () => {
  const mockedSdk = {
    ...SDK_MOCK,
    field: {
      ...SDK_MOCK.field,
      getValue: () => ({
        ready: true,
        assetId: 'test-assetId123',
        signedPlaybackId: 'test-playbackId123',
      }),
    },
  };

  const wrapper = await shallow(<App sdk={mockedSdk as any} />);
  wrapper.instance().forceUpdate();
  await (wrapper.instance() as App).setSignedPlayback('test-playbackId123');
  expect(wrapper.state('error')).toEqual(
    'Error: this asset was created with a signed playback ID, but signing keys do not exist for your account'
  );
  expect(wrapper.find('Player')).toHaveLength(0);
});

test('displays an error if the asset is errored', () => {
  const mockedSdk = {
    ...SDK_MOCK,
    field: {
      ...SDK_MOCK.field,
      getValue: () => ({
        error: 'Input file does not contain a duration',
      }),
    },
  };

  const wrapper = mount(<App sdk={mockedSdk as any} />);
  const note = wrapper.find('Note');
  expect(note.prop('noteType')).toBe('negative');
  expect(note.text()).toContain('Input file does not contain a duration');
});

test('displays a loading state between the asset getting created and waiting for it to be ready', () => {
  const mockedSdk = {
    ...SDK_MOCK,
    field: {
      ...SDK_MOCK.field,
      getValue: () => ({
        assetId: 'abcd1234',
        ready: false,
      }),
    },
  };

  const wrapper = mount(<App sdk={mockedSdk as any} />);
  expect(wrapper.find('Spinner')).toHaveLength(1);
  expect(wrapper.find('Paragraph').text()).toContain('Waiting for asset');
});

test('displays upload progress while uploading', () => {
  const mockedSdk = {
    ...SDK_MOCK,
    field: {
      ...SDK_MOCK.field,
      getValue: () => ({}),
    },
  };

  const wrapper = mount(<App sdk={mockedSdk as any} />);

  wrapper.setState({ uploadProgress: 50 });

  expect(wrapper.find('Spinner')).toHaveLength(1);
  expect(wrapper.find('.progress')).toHaveLength(1);
  expect(wrapper.find('.progress').prop('style')).toEqual({ width: '50%' });
});

test('checks the status of an unfinished asset on load', () => {
  const mockedSdk = {
    ...SDK_MOCK,
    field: {
      ...SDK_MOCK.field,
      getValue: () => ({
        uploadId: '1234',
      }),
    },
  };

  const wrapper = mount(<App sdk={mockedSdk as any} />);

  wrapper.setState({ uploadProgress: 50 });

  expect(wrapper.find('Spinner')).toHaveLength(1);
  expect(wrapper.find('.progress')).toHaveLength(1);
  expect(wrapper.find('.progress').prop('style')).toEqual({ width: '50%' });
});
