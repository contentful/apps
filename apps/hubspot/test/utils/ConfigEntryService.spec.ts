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

  it('getConfigEntry fetches and caches the config entry', async () => {
    const fakeEntry = { sys: { id: 'config' }, fields: {} };
    cmaMock.entry.get.mockResolvedValue(fakeEntry);

    const result1 = await service.getConfigEntry();
    const result2 = await service.getConfigEntry();

    expect(result1).toBe(fakeEntry);
    expect(result2).toBe(fakeEntry);
    expect(cmaMock.entry.get).toHaveBeenCalledTimes(1); // Only fetched once due to caching
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
});
