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

// TDOO Could add some more tests around user activity (choosing which user did the thing)
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
    expect(result).to.have.property('spaceName', 'TODO: Space name');
    expect(result).to.have.property('contentTypeName', mockContentType.name);
    expect(result).to.have.property('entryTitle', entryEvent.entry.fields.title['en-US']);
    expect(result).to.have.property('entryId', entryEvent.entry.sys.id);
    expect(result).to.have.property('spaceId', entryEvent.entry.sys.space.sys.id);
    expect(result).to.have.property('contentTypeId', mockContentType.sys.id);
    expect(result).to.have.property('action', 'saved');
    expect(result).to.have.property('actorName', 'Gavin Matthews');
    expect(result).to.have.property('eventDatetime', entryEvent.eventDatetime);
  });

  describe('when when no displayField in content type', () => {
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

  // there should always be a default locale in the entry, but it's po
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
