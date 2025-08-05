import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfigEntryService from '../../src/utils/ConfigEntryService';

describe('ConfigEntryService', () => {
  let cmaMock: any;
  let service: ConfigEntryService;
  const defaultLocale = 'en-US';

  beforeEach(() => {
    cmaMock = {
      entry: {
        get: vi.fn(),
        update: vi.fn(),
      },
      locale: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            { default: true, code: 'en-US' },
            { default: false, code: 'es-ES' },
          ],
        }),
      },
    };
    service = new ConfigEntryService(cmaMock);
  });

  it('updateEntryConnectedFields updates the config entry and returns the updated entry', async () => {
    const initialEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: { 'old-test-entry-id': [{ name: 'Tito' }] } } },
    };
    const updatedEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: { 'new-test-entry-id': [{ name: 'Tito' }] } } },
    };
    cmaMock.entry.get.mockResolvedValue(initialEntry);
    cmaMock.entry.update.mockResolvedValue(updatedEntry);

    const result = await service.updateEntryConnectedFields('new-test-entry-id', [
      {
        name: 'Tito',
      },
    ] as any);

    expect(result).toBe(updatedEntry);
    expect(cmaMock.entry.update).toHaveBeenCalledWith(
      { entryId: 'hubspotConfig' },
      expect.objectContaining({
        fields: {
          connectedFields: {
            [defaultLocale]: {
              'new-test-entry-id': [{ name: 'Tito' }],
              'old-test-entry-id': [{ name: 'Tito' }],
            },
          },
        },
      })
    );
  });

  it('updateEntryConnectedFields creates the config field if it does not exist', async () => {
    const initialEntry = { sys: { id: 'config' }, fields: {} };
    const updatedEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: { 'test-entry-id': [{ test: 123 }] } } },
    };
    cmaMock.entry.get.mockResolvedValue(initialEntry);
    cmaMock.entry.update.mockResolvedValue(updatedEntry);

    const result = await service.updateEntryConnectedFields('test-entry-id', [
      { test: 123 },
    ] as any);

    expect(result).toBe(updatedEntry);
    expect(cmaMock.entry.update).toHaveBeenCalledWith(
      { entryId: 'hubspotConfig' },
      expect.objectContaining({
        fields: {
          connectedFields: { [defaultLocale]: { 'test-entry-id': [{ test: 123 }] } },
        },
      })
    );
  });

  it('removeEntryConnectedFields updates the config entry and returns the updated entry', async () => {
    const initialEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: { 'test-entry-id': [{ name: 'Tito' }] } } },
    };
    const updatedEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: {} } },
    };
    cmaMock.entry.get.mockResolvedValue(initialEntry);
    cmaMock.entry.update.mockResolvedValue(updatedEntry);

    const result = await service.removeEntryConnectedFields('test-entry-id');

    expect(result).toBe(updatedEntry);
    expect(cmaMock.entry.update).toHaveBeenCalledWith(
      { entryId: 'hubspotConfig' },
      expect.objectContaining({
        fields: {
          connectedFields: { [defaultLocale]: {} },
        },
      })
    );
  });

  it('getConnectedFields returns the correct fields for the default locale', async () => {
    const connectedFields = { foo: [{ fieldId: 'bar', moduleName: 'baz' }] };
    const configEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: connectedFields } },
    };
    cmaMock.entry.get.mockResolvedValue(configEntry);

    service = new ConfigEntryService(cmaMock);
    const result = await service.getConnectedFields();

    expect(result).toEqual(connectedFields);
  });

  it('getConnectedFields returns empty object config entry is not found', async () => {
    const configEntry = {
      sys: { id: 'config' },
      fields: {},
    };
    cmaMock.entry.get.mockResolvedValue(configEntry);

    service = new ConfigEntryService(cmaMock);

    await expect(service.getConnectedFields()).resolves.toEqual({});
  });

  it('getConnectedFields throws if get config entry throws', async () => {
    cmaMock.entry.get.mockRejectedValue(new Error('test'));

    service = new ConfigEntryService(cmaMock);

    await expect(service.getConnectedFields()).rejects.toThrow();
  });

  it('getEntryConnectedFields returns the correct fields for an entryId', async () => {
    const connectedFields = {
      foo: [{ fieldId: 'bar', moduleName: 'baz' }],
      test: [{ fieldId: 'f', moduleName: 'm' }],
    };
    const configEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: connectedFields } },
    };
    cmaMock.entry.get.mockResolvedValue(configEntry);

    service = new ConfigEntryService(cmaMock);
    const result = await service.getEntryConnectedFields('test');

    expect(result).toEqual([{ fieldId: 'f', moduleName: 'm' }]);
  });

  it('getEntryConnectedFields returns an empty array if entryId not found', async () => {
    const connectedFields = {
      foo: [{ fieldId: 'bar', moduleName: 'baz' }],
    };
    const configEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: connectedFields } },
    };
    cmaMock.entry.get.mockResolvedValue(configEntry);

    service = new ConfigEntryService(cmaMock);
    const result = await service.getEntryConnectedFields('notfound');

    expect(result).toEqual([]);
  });
});
