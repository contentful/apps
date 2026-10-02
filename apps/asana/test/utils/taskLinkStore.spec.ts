import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureTaskLinkContentType, recordAutosaveComment } from '../../src/utils/taskLinkStore';

describe('ensureTaskLinkContentType', () => {
  const mockCma = {
    contentType: {
      get: vi.fn(),
      createWithId: vi.fn(),
      update: vi.fn(),
      publish: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates the content type with every field, including lastAutosaveCommentAt, when it does not exist', async () => {
    mockCma.contentType.get.mockRejectedValue(new Error('not found'));
    mockCma.contentType.createWithId.mockResolvedValue({
      sys: { id: 'asanaTaskLink' },
      fields: [],
    });

    await ensureTaskLinkContentType(mockCma);

    const createdFields = mockCma.contentType.createWithId.mock.calls[0][1].fields;
    expect(createdFields.map((field: { id: string }) => field.id)).toContain(
      'lastAutosaveCommentAt'
    );
    expect(mockCma.contentType.publish).toHaveBeenCalled();
  });

  it('does nothing when the content type already has every field', async () => {
    mockCma.contentType.get.mockResolvedValue({
      sys: { id: 'asanaTaskLink' },
      fields: [
        { id: 'contentfulEntryId' },
        { id: 'contentTypeId' },
        { id: 'taskGid' },
        { id: 'taskUrl' },
        { id: 'taskName' },
        { id: 'taskDescription' },
        { id: 'status' },
        { id: 'assigneeName' },
        { id: 'dueDate' },
        { id: 'lastSyncedAt' },
        { id: 'lastAutosaveCommentAt' },
        { id: 'isPrimary' },
      ],
    });

    await ensureTaskLinkContentType(mockCma);

    expect(mockCma.contentType.update).not.toHaveBeenCalled();
  });

  it('patches in lastAutosaveCommentAt for an existing content type that predates it', async () => {
    mockCma.contentType.get.mockResolvedValue({
      sys: { id: 'asanaTaskLink' },
      fields: [{ id: 'contentfulEntryId' }, { id: 'taskGid' }, { id: 'lastSyncedAt' }],
    });
    mockCma.contentType.update.mockResolvedValue({ sys: { id: 'asanaTaskLink' } });

    await ensureTaskLinkContentType(mockCma);

    const updatedFields = mockCma.contentType.update.mock.calls[0][1].fields;
    expect(updatedFields.map((field: { id: string }) => field.id)).toContain(
      'lastAutosaveCommentAt'
    );
    expect(mockCma.contentType.publish).toHaveBeenCalled();
  });
});

describe('recordAutosaveComment', () => {
  const mockCma = {
    locale: { getMany: vi.fn() },
    entry: { getMany: vi.fn(), update: vi.fn(), publish: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCma.locale.getMany.mockResolvedValue({ items: [{ code: 'en-US', default: true }] });
  });

  it('does nothing when the entry has no task link', async () => {
    mockCma.entry.getMany.mockResolvedValue({ items: [] });

    await recordAutosaveComment(mockCma, 'entry-1');

    expect(mockCma.entry.update).not.toHaveBeenCalled();
  });

  it('stamps lastAutosaveCommentAt on the linked task entry and republishes it', async () => {
    const existingEntry = {
      sys: { id: 'link-entry-1' },
      fields: { taskGid: { 'en-US': 'task-linked' } },
    };
    mockCma.entry.getMany.mockResolvedValue({ items: [existingEntry] });
    mockCma.entry.update.mockResolvedValue({ sys: { id: 'link-entry-1' } });

    await recordAutosaveComment(mockCma, 'entry-1');

    expect(mockCma.entry.update).toHaveBeenCalledWith(
      { entryId: 'link-entry-1' },
      expect.objectContaining({
        fields: expect.objectContaining({
          lastAutosaveCommentAt: { 'en-US': expect.any(String) },
        }),
      })
    );
    expect(mockCma.entry.publish).toHaveBeenCalledWith(
      { entryId: 'link-entry-1' },
      { sys: { id: 'link-entry-1' } }
    );
  });
});
