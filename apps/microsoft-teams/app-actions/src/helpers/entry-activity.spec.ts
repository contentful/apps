import { expect } from 'chai';
import sinon from 'sinon';
import { buildEntryActivity } from './entry-activity';
import {
  CollectionProp,
  ContentTypeProps,
  EntryProps,
  LocaleProps,
  PlainClientAPI,
  UserProps,
} from 'contentful-management';
import {
  makeMockPlainClient,
  mockContentType,
  mockEntryEvent,
  mockLocaleCollection,
  mockUser,
} from '../../test/mocks';
import { EntryEvent } from '../types';

describe('buildEntryActivity', () => {
  let cmaRequestStub: sinon.SinonStub;
  let cmaClientMockResponses: [ContentTypeProps, CollectionProp<LocaleProps>, UserProps];
  let cma: PlainClientAPI;
  let entryEvent: EntryEvent;
  let cmaHost: string;

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    cmaClientMockResponses = [mockContentType, mockLocaleCollection, mockUser];
    cma = makeMockPlainClient(cmaClientMockResponses, cmaRequestStub);
    entryEvent = { ...mockEntryEvent };
    cmaHost = 'api.contentful.com';
  });

  it('returns an entry activity object', async () => {
    const result = await buildEntryActivity(entryEvent, cma, cmaHost);
    const entryId = entryEvent.entry.sys.id;
    const spaceId = entryEvent.entry.sys.space.sys.id;
    const environmentId = entryEvent.entry.sys.environment.sys.id;
    const url = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}`;

    expect(result).to.have.property('contentTypeName', mockContentType.name);
    expect(result).to.have.property('entryTitle', entryEvent.entry.fields.title['en-US']);
    expect(result).to.have.property('action', 'archived');
    expect(result).to.have.property('eventDatetime', entryEvent.eventDatetime);
    expect(result).to.have.property('entryUrl', url);
    expect(result).to.have.property('entryId', entryId);
  });

  describe('when no displayField in content type', () => {
    beforeEach(() => {
      cmaClientMockResponses = [
        //
        // @ts-expect-error the type of displayField is incorrect, it can be null in the API
        { ...mockContentType, displayField: null },

        mockLocaleCollection,
        mockUser,
      ];
      cma = makeMockPlainClient(cmaClientMockResponses, cmaRequestStub);
      cmaHost = 'api.contentful.com';
    });

    it('returns an entry activity object', async () => {
      const result = await buildEntryActivity(entryEvent, cma, cmaHost);
      expect(result).to.have.property('entryTitle', 'Entry ID abc123');
    });
  });

  describe('when there are no fields in the entry (e.g. entry was deleted)', () => {
    beforeEach(() => {
      // Here we are mocking an entry that lacks fields, which is the case when the entry type is DeletedEntry
      // (i.e. for unpublish and delete events)
      const mockDeletedEntry = {
        ...mockEntryEvent.entry,
        fields: undefined,
      } as unknown as EntryProps;
      entryEvent = { ...mockEntryEvent, entry: mockDeletedEntry };
    });

    it('returns an entry activity object', async () => {
      const result = await buildEntryActivity(entryEvent, cma, cmaHost);
      expect(result).to.have.property('entryTitle', 'Entry ID abc123');
    });
  });

  // there should always be a default locale in the entry, but just a small sanity
  // check to make sure our fallback logic works
  describe('when default locale not in entry', () => {
    beforeEach(() => {
      entryEvent = {
        ...mockEntryEvent,
        entry: {
          ...mockEntryEvent.entry,
          fields: {
            ...mockEntryEvent.entry.fields,
            title: {
              'fr-CA': "c'est francais",
            },
          },
        },
      };
    });

    it('returns an entry activity object', async () => {
      const result = await buildEntryActivity(entryEvent, cma, cmaHost);
      expect(result).to.have.property('entryTitle', 'Entry ID abc123');
    });
  });

  describe('when using EU data residency', () => {
    beforeEach(() => {
      cmaHost = 'api.eu.contentful.com';
    });

    it('returns an entry activity object', async () => {
      const result = await buildEntryActivity(entryEvent, cma, cmaHost);
      const entryId = entryEvent.entry.sys.id;
      const spaceId = entryEvent.entry.sys.space.sys.id;
      const environmentId = entryEvent.entry.sys.environment.sys.id;
      const url = `https://app.eu.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}`;

      expect(result).to.have.property('entryUrl', url);
    });
  });

  describe('when in the master environment', () => {
    beforeEach(() => {
      entryEvent = {
        ...mockEntryEvent,
        entry: {
          ...mockEntryEvent.entry,
          sys: {
            ...mockEntryEvent.entry.sys,
            environment: {
              ...mockEntryEvent.entry.sys.environment,
              sys: {
                ...mockEntryEvent.entry.sys.environment.sys,
                id: 'master',
              },
            },
          },
        },
      };
      cmaHost = 'api.contentful.com';
    });

    it('returns an entry activity object', async () => {
      const result = await buildEntryActivity(entryEvent, cma, cmaHost);
      const entryId = entryEvent.entry.sys.id;
      const spaceId = entryEvent.entry.sys.space.sys.id;
      const url = `https://app.contentful.com/spaces/${spaceId}/entries/${entryId}`;

      expect(result).to.have.property('entryUrl', url);
    });
  });
});
