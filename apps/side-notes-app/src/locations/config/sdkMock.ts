import { ContentFields, KeyValueMap } from 'contentful-management';

/* 
  This is a mock of the field extension sdk which we will use for rendering disabled field editors in the config location.
*/

type SelectedField = ContentFields<KeyValueMap>;

const defaultLocale = 'en-US';

const createMockAccessApi = () => {
  return {
    can: () => new Promise(() => true),
  };
};

const createMockEntryApi = () => {
  return {
    fields: {},
    onSysChanged: () => null,
    getSys: () => {
      return {
        id: 'id',
      };
    },
  };
};

const createMockFieldApi = ({ ref }: { ref: SelectedField }) => {
  return {
    id: ref.id,
    type: ref.type,
    required: ref.required,
    validations: ref.validations,
    items: ref.items,
    locale: defaultLocale,
    setValue: () => null,
    removeValue: () => null,
    setInvalid: () => null,
    getValue: () => '',
    onIsDisabledChanged: () => null,
    onSchemaErrorsChanged: () => null,
    onValueChanged: () => null,
  };
};

const createMockLocalesApi = () => {
  return {
    default: defaultLocale,
    available: [defaultLocale],
    names: {
      [defaultLocale]: 'American English',
    },
    fallbacks: {},
    optional: {
      [defaultLocale]: false,
    },
    direction: {
      [defaultLocale]: 'ltr',
    },
  };
};

const createMockContentTypesApi = ({ ref }: { ref: SelectedField }) => {
  const field = createMockFieldApi({ ref });
  return {
    displayField: Math.random().toString(),
    fields: [field],
  };
};

const createMockIdsApi = ({ ref }: { ref: SelectedField }) => {
  return {
    field: ref.id,
    space: 'space',
    environment: 'environment',
    envrionemtnAlias: 'alias',
  };
};

const createMockParametersApi = () => {
  return {
    instance: {},
  };
};

const createMockSpaceApi = () => {
  return {
    onEntityChanged: () => null,
    getEntries: () => Promise.resolve([]),
    getCachedContentTypes: () => [],
  };
};

const createMockNavigatorApi = () => {
  return {
    onSlideInNavigation: () => null,
  };
};

const createMockCmaAdapter = () => {
  return {
    makeRequest: () => {},
  };
};

export const createMockFieldExtensionSDK = ({
  ref,
}: {
  ref: ContentFields<KeyValueMap> | undefined;
}) => {
  if (!ref) {
    return {};
  }

  const field = createMockFieldApi({ ref });
  const locales = createMockLocalesApi();
  const contentType = createMockContentTypesApi({ ref });
  const ids = createMockIdsApi({ ref });
  const access = createMockAccessApi();
  const entry = createMockEntryApi();
  const space = createMockSpaceApi();
  const navigator = createMockNavigatorApi();
  const cmaAdapter = createMockCmaAdapter();
  const parameters = createMockParametersApi();

  return {
    access,
    cmaAdapter,
    contentType,
    entry,
    field,
    ids,
    locales,
    navigator,
    parameters,
    space,
  };
};
