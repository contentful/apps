import { expect } from 'chai';
import sinon from 'sinon';
import { buildEntryActivity } from './entry-activity';
import {
  CollectionProp,
  ContentTypeProps,
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

  beforeEach(() => {
    cmaRequestStub = sinon.stub();
    cmaClientMockResponses = [mockContentType, mockLocaleCollection, mockUser];
    cma = makeMockPlainClient(cmaClientMockResponses, cmaRequestStub);
    entryEvent = { ...mockEntryEvent };
  });

  it('returns an entry activity object', async () => {
    const result = await buildEntryActivity(entryEvent, cma);
    expect(result).to.have.property('contentTypeName', mockContentType.name);
    expect(result).to.have.property('entryTitle', entryEvent.entry.fields.title['en-US']);
    expect(result).to.have.property('entryId', entryEvent.entry.sys.id);
    expect(result).to.have.property('spaceId', entryEvent.entry.sys.space.sys.id);
    expect(result).to.have.property('contentTypeId', mockContentType.sys.id);
    expect(result).to.have.property('action', 'archived');
    expect(result).to.have.property('eventDatetime', entryEvent.eventDatetime);
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
    });

    it('returns an entry activity object', async () => {
      const result = await buildEntryActivity(entryEvent, cma);
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
      const result = await buildEntryActivity(entryEvent, cma);
      expect(result).to.have.property('entryTitle', 'Entry ID abc123');
    });
  });
});
