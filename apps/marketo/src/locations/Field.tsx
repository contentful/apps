import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Paragraph,
  Flex,
  Spinner,
  Autocomplete,
  FormControl,
  Note,
} from '@contentful/f36-components';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import type {
  FormObject,
  MarketoFolderRef,
  MarketoFolderStatusResponse,
  MarketoFormsResponse,
  MarketoFormWithFolder,
} from '../types';
import { GET_FOLDER_STATUS_APP_ACTION_ID, GET_FORMS_APP_ACTION_ID } from '../const';
import { delay } from '../utils';

type ErrorState = {
  error: boolean;
  message: string;
};

const EMPTY_FORM: FormObject = { id: '', name: '', url: '' };
const DROPDOWN_EXPANDED_HEIGHT = 240;
const FORM_ERROR_MESSAGE =
  'Could not load Marketo forms. Please try again or contact a space admin.';
const PARTIAL_LOAD_MESSAGE =
  'Some Marketo forms could not be loaded. Reload the entry to try again.';

const FOLDERS_PER_CALL = 10;
// Keeps the field at about 40 Marketo requests per 20 seconds, well under
// Marketo's per-instance limit of 100 that every integration shares.
const MS_PER_MARKETO_REQUEST = 500;
const RATE_LIMIT_WAIT_MS = 20_000;
const MAX_RATE_LIMIT_RETRIES = 3;
const FOLDER_STATUS_TTL_MS = 24 * 60 * 60 * 1000;

type FolderStatuses = Record<string, { isArchive: boolean; checkedAt: number }>;

const folderKey = ({ id, type }: MarketoFolderRef) => `${type}:${id}`;

// Folder archive status is saved per browser so later loads skip lookups.
const readFolderStatuses = (storageKey: string): FolderStatuses => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as FolderStatuses;
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(saved).filter(([, status]) => now - status.checkedAt < FOLDER_STATUS_TTL_MS)
    );
  } catch {
    return {};
  }
};

const saveFolderStatuses = (storageKey: string, statuses: FolderStatuses) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(statuses));
  } catch {
    // Storage can be unavailable; the next load checks folders again.
  }
};

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();
  const [forms, setForms] = useState<FormObject[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<FormObject>(EMPTY_FORM);
  const [loadingData, setLoadingStatus] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [partialLoadError, setPartialLoadError] = useState(false);
  const [error, updateError] = useState<ErrorState>({ error: false, message: '' });
  // Forms keep arriving after the first render; once the editor interacts
  // with the field, later pages must not override their selection.
  const selectionTouchedRef = useRef(false);

  const filteredForms = useMemo(
    () =>
      (forms ?? []).filter((form) => {
        if (selectedForm && selectedForm.id === form.id) {
          return false;
        }
        return form.name.toLowerCase().includes(searchTerm);
      }),
    [forms, searchTerm, selectedForm]
  );

  const handleDropdownOpen = () => {
    sdk.window.stopAutoResizer();
    sdk.window.updateHeight(DROPDOWN_EXPANDED_HEIGHT);
  };

  const handleDropdownClose = () => {
    sdk.window.startAutoResizer();
  };

  const updateFieldValue = (form: FormObject | null) => {
    if (!form) {
      return;
    }
    sdk.field.setValue({ id: form.id, url: form.url });
    selectionTouchedRef.current = true;
    setSelectedForm(form);
    setSearchTerm('');
  };

  const handleFormInputChange = (value: string) => {
    if (value) {
      selectionTouchedRef.current = true;
    }
    if (!value && selectedForm?.id) {
      removeFieldValue();
      return;
    }

    setSearchTerm(value.trim().toLowerCase());
  };

  const removeFieldValue = () => {
    sdk.field.setValue(EMPTY_FORM);
    selectionTouchedRef.current = true;
    setSelectedForm(EMPTY_FORM);
    setSearchTerm('');
  };

  useEffect(() => {
    let cancelled = false;

    const storageKey = `marketo-folder-status:${sdk.ids.space}:${sdk.ids.environment}:${
      sdk.parameters.installation?.munchkinId ?? ''
    }`;
    const statuses = readFolderStatuses(storageKey);

    // Each call is followed by a pause sized to the Marketo requests it made.
    const callAction = async <T,>(
      appActionId: string,
      parameters: Record<string, string | number>,
      marketoRequests: number
    ) => {
      const { response } = await sdk.cma.appActionCall.createWithResponse(
        { appDefinitionId: sdk.ids.app!, appActionId },
        { parameters }
      );
      await delay(marketoRequests * MS_PER_MARKETO_REQUEST);
      return JSON.parse(response.body) as T;
    };

    // A page costs Marketo two requests: auth and forms.json.
    const fetchPage = async (offset?: number) => {
      for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
        if (attempt > 0) await delay(RATE_LIMIT_WAIT_MS);
        const result = await callAction<MarketoFormsResponse>(
          GET_FORMS_APP_ACTION_ID,
          offset === undefined ? {} : { offset },
          2
        );
        if (!result.rateLimited) return result;
      }
      throw new Error('Marketo kept rate limiting the forms request');
    };

    // A folder batch costs Marketo auth plus one request per folder. Only the
    // folders that were rate limited are sent again.
    const checkFolders = async (folders: MarketoFolderRef[]) => {
      let pending = folders;
      for (let attempt = 0; pending.length > 0; attempt++) {
        if (attempt > MAX_RATE_LIMIT_RETRIES) {
          throw new Error('Marketo kept rate limiting folder requests');
        }
        if (attempt > 0) await delay(RATE_LIMIT_WAIT_MS);
        const result = await callAction<MarketoFolderStatusResponse>(
          GET_FOLDER_STATUS_APP_ACTION_ID,
          { folders: pending.map(folderKey).join(',') },
          1 + pending.length
        );
        for (const folder of result.folders) {
          statuses[folderKey(folder)] = { isArchive: folder.isArchive, checkedAt: Date.now() };
        }
        if (!result.rateLimited) return;
        pending = pending.filter((folder) => !(folderKey(folder) in statuses));
      }
    };

    // Shows forms as soon as their folder is known not to be archived, and
    // keeps loading the remaining pages in the background so search covers
    // every form.
    const loadForms = async () => {
      const fieldValue = sdk.field.getValue();
      let loaded: MarketoFormWithFolder[] = [];
      let visible: FormObject[] = [];
      let offset: number | undefined;

      const showVisibleForms = () => {
        visible = loaded.filter(
          (form) => !form.folder || statuses[folderKey(form.folder)]?.isArchive === false
        );
        setForms(visible);
        if (fieldValue?.id && !selectionTouchedRef.current) {
          const preselectedForm = visible.find((form) => form.id === fieldValue.id);
          if (preselectedForm) {
            setSelectedForm(preselectedForm);
          }
        }
      };

      try {
        do {
          const result = await fetchPage(offset);
          if (cancelled) return;
          if (!result.forms) {
            throw new Error('Marketo forms response has no forms');
          }

          const loadedIds = new Set(loaded.map((form) => form.id));
          const newForms = result.forms.filter((form) => !loadedIds.has(form.id));
          loaded = [...loaded, ...newForms];

          showVisibleForms();
          setLoadingStatus(false);
          setLoadingMore(true);

          const unknownFolders = new Map<string, MarketoFolderRef>();
          for (const { folder } of newForms) {
            if (folder && !(folderKey(folder) in statuses)) {
              unknownFolders.set(folderKey(folder), folder);
            }
          }
          const folders = [...unknownFolders.values()];
          for (let i = 0; i < folders.length; i += FOLDERS_PER_CALL) {
            await checkFolders(folders.slice(i, i + FOLDERS_PER_CALL));
            if (cancelled) return;
            saveFolderStatuses(storageKey, statuses);
            showVisibleForms();
          }

          // A non-empty page with nothing new means paging isn't advancing.
          const stalled = result.forms.length > 0 && newForms.length === 0;
          offset = stalled ? undefined : result.nextOffset;
          setLoadingMore(offset !== undefined);
        } while (offset !== undefined);
      } catch {
        if (cancelled) return;
        if (visible.length > 0) {
          setPartialLoadError(true);
        } else {
          updateError({
            error: true,
            message: FORM_ERROR_MESSAGE,
          });
        }
        setLoadingStatus(false);
        setLoadingMore(false);
      }
    };

    loadForms();

    return () => {
      cancelled = true;
    };
  }, [sdk.field]);

  if (loadingData || (forms?.length === 0 && loadingMore)) {
    return (
      <Flex alignItems="center" gap="spacingXs">
        <Paragraph marginBottom="none">Loading Marketo forms</Paragraph>
        <Spinner color="primary" />
      </Flex>
    );
  }

  if (error.error) {
    return <Note variant="negative">{error.message}</Note>;
  }

  if (forms && forms.length === 0) {
    return <Note variant="warning">No Marketo forms found</Note>;
  }

  return (
    <Flex flexDirection="column" fullHeight style={{ width: '99%' }}>
      {forms && forms.length > 0 && (
        <>
          <FormControl>
            <Autocomplete<FormObject>
              items={filteredForms.filter((item) => item.id !== selectedForm?.id)}
              selectedItem={selectedForm}
              onInputValueChange={handleFormInputChange}
              onSelectItem={updateFieldValue}
              onOpen={handleDropdownOpen}
              onClose={handleDropdownClose}
              placeholder="Select a form"
              itemToString={(item) => (item ? item.name : '')}
              renderItem={(item) => item.name}
              listWidth="full"
            />
          </FormControl>
          {loadingMore && (
            <Flex alignItems="center" gap="spacingXs">
              <Paragraph marginBottom="none">Loading more Marketo forms</Paragraph>
              <Spinner size="small" color="primary" />
            </Flex>
          )}
        </>
      )}
      {partialLoadError && <Note variant="warning">{PARTIAL_LOAD_MESSAGE}</Note>}
    </Flex>
  );
};

export default Field;
