import { useState, useEffect, useRef } from 'react';
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
import type { FormObject, MarketoFormsResponse } from '../types';
import { GET_FORMS_APP_ACTION_ID } from '../const';

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

const matchesSearch = (form: FormObject, searchTerm: string, selectedId: string) =>
  form.id !== selectedId && form.name.toLowerCase().includes(searchTerm);

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();
  const [forms, setForms] = useState<FormObject[] | null>(null);
  const [filteredForms, setFilteredForms] = useState<FormObject[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormObject>(EMPTY_FORM);
  const [loadingData, setLoadingStatus] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [partialLoadError, setPartialLoadError] = useState(false);
  const [error, updateError] = useState<ErrorState>({ error: false, message: '' });
  // Forms keep arriving page by page after the first render, so the latest
  // search, selection, and saved-but-not-yet-loaded form are read from refs.
  const searchTermRef = useRef('');
  const selectedIdRef = useRef('');
  const pendingSelectionIdRef = useRef<string | undefined>(undefined);

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
    setSelectedForm(form);
    selectedIdRef.current = form.id;
    pendingSelectionIdRef.current = undefined;
    searchTermRef.current = '';
    if (forms) {
      setFilteredForms(forms.filter((item) => item.id !== form.id));
    }
  };

  const handleFormInputChange = (value: string) => {
    if (value) {
      pendingSelectionIdRef.current = undefined;
    }
    if (!value && selectedForm?.id) {
      removeFieldValue();
      return;
    }

    const normalizedValue = value.trim().toLowerCase();
    searchTermRef.current = normalizedValue;
    if (!forms) {
      setFilteredForms([]);
      return;
    }
    setFilteredForms(
      forms.filter((form) => matchesSearch(form, normalizedValue, selectedForm?.id ?? ''))
    );
  };

  const removeFieldValue = () => {
    sdk.field.setValue(EMPTY_FORM);
    setSelectedForm(EMPTY_FORM);
    selectedIdRef.current = '';
    pendingSelectionIdRef.current = undefined;
    searchTermRef.current = '';
    setFilteredForms(forms || []);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchPage = async (offset?: number) => {
      const { response } = await sdk.cma.appActionCall.createWithResponse(
        {
          appDefinitionId: sdk.ids.app!,
          appActionId: GET_FORMS_APP_ACTION_ID,
        },
        {
          parameters: offset === undefined ? {} : { offset },
        }
      );
      return JSON.parse(response.body) as MarketoFormsResponse;
    };

    // Shows the first page as soon as it arrives, then keeps loading the
    // remaining pages in the background so search covers every form.
    const loadForms = async () => {
      pendingSelectionIdRef.current = sdk.field.getValue()?.id || undefined;
      let loaded: FormObject[] = [];
      let offset: number | undefined;

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

          const pendingId = pendingSelectionIdRef.current;
          const preselectedForm = pendingId && loaded.find((form) => form.id === pendingId);
          if (preselectedForm) {
            setSelectedForm(preselectedForm);
            selectedIdRef.current = preselectedForm.id;
            pendingSelectionIdRef.current = undefined;
          }

          setForms(loaded);
          setFilteredForms(
            loaded.filter((form) =>
              matchesSearch(form, searchTermRef.current, selectedIdRef.current)
            )
          );
          setLoadingStatus(false);

          // A non-empty page with nothing new means paging isn't advancing.
          const stalled = result.forms.length > 0 && newForms.length === 0;
          offset = stalled ? undefined : result.nextOffset;
          setLoadingMore(offset !== undefined);
        } while (offset !== undefined);
      } catch {
        if (cancelled) return;
        if (loaded.length > 0) {
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
