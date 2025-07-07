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
    };
    service = new ConfigEntryService(cmaMock, defaultLocale);
  });

  it('updateConfig updates the config entry and returns the updated entry', async () => {
    const initialEntry = { sys: { id: 'config' }, fields: {} };
    const updatedEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: { name: 'Tito' } } },
    };
    cmaMock.entry.get.mockResolvedValue(initialEntry);
    cmaMock.entry.update.mockResolvedValue(updatedEntry);

    const result = await service.updateConfig({ name: 'Tito' } as any);

    expect(result).toBe(updatedEntry);
    expect(cmaMock.entry.update).toHaveBeenCalledWith(
      { entryId: 'hubspotConfig' },
      expect.objectContaining({
        fields: expect.objectContaining({ connectedFields: { [defaultLocale]: { name: 'Tito' } } }),
      })
    );
  });

  it('updateConfig creates the config field if it does not exist', async () => {
    const initialEntry = { sys: { id: 'config' }, fields: {} };
    const updatedEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: { test: 123 } } },
    };
    cmaMock.entry.get.mockResolvedValue(initialEntry);
    cmaMock.entry.update.mockResolvedValue(updatedEntry);

    const result = await service.updateConfig({ test: 123 } as any);

    expect(result).toBe(updatedEntry);
    expect(cmaMock.entry.update).toHaveBeenCalledWith(
      { entryId: 'hubspotConfig' },
      expect.objectContaining({
        fields: expect.objectContaining({ connectedFields: { [defaultLocale]: { test: 123 } } }),
      })
    );
  });

  it('getConnectedFields returns the correct fields for the default locale', async () => {
    const connectedFields = { foo: [{ fieldId: 'bar', moduleId: 'baz' }] };
    const configEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: connectedFields } },
    };
    cmaMock.entry.get.mockResolvedValue(configEntry);

    service = new ConfigEntryService(cmaMock, defaultLocale);
    const result = await service.getConnectedFields();

    expect(result).toEqual(connectedFields);
  });

  it('getConnectedFields throws if config field is missing', async () => {
    const configEntry = {
      sys: { id: 'config' },
      fields: {},
    };
    cmaMock.entry.get.mockResolvedValue(configEntry);

    service = new ConfigEntryService(cmaMock, defaultLocale);

    await expect(service.getConnectedFields()).rejects.toThrow();
  });

  it('getEntryConnectedFields returns the correct fields for an entryId', async () => {
    const connectedFields = {
      foo: [{ fieldId: 'bar', moduleId: 'baz' }],
      test: [{ fieldId: 'f', moduleId: 'm' }],
    };
    const configEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: connectedFields } },
    };
    cmaMock.entry.get.mockResolvedValue(configEntry);

    service = new ConfigEntryService(cmaMock, defaultLocale);
    const result = await service.getEntryConnectedFields('test');

    expect(result).toEqual([{ fieldId: 'f', moduleId: 'm' }]);
  });

  it('getEntryConnectedFields returns an empty array if entryId not found', async () => {
    const connectedFields = {
      foo: [{ fieldId: 'bar', moduleId: 'baz' }],
    };
    const configEntry = {
      sys: { id: 'config' },
      fields: { connectedFields: { [defaultLocale]: connectedFields } },
    };
    cmaMock.entry.get.mockResolvedValue(configEntry);

    service = new ConfigEntryService(cmaMock, defaultLocale);
    const result = await service.getEntryConnectedFields('notfound');

    expect(result).toEqual([]);
  });
});
