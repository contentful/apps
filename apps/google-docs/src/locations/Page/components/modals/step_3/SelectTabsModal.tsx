import { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  Modal,
  Paragraph,
  Pill,
  Multiselect,
  Radio,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { css } from '@emotion/css';

interface SelectTabsModalProps {
  sdk: PageAppSDK;
  isOpen: boolean;
  onBack: () => void;
  onContinue: (selectedTabs: DocumentTabProps[]) => void;
  onClose: () => void;
}

export interface DocumentTabProps {
  tabId: string;
  tabTitle: string;
}

const MOCK_TABS: DocumentTabProps[] = [
  { tabId: 'tab-1', tabTitle: 'Introduction' },
  { tabId: 'tab-2', tabTitle: 'Chapter 1' },
  { tabId: 'tab-3', tabTitle: 'Chapter 2' },
  { tabId: 'tab-4', tabTitle: 'Appendix' },
  { tabId: 'tab-5', tabTitle: 'References' },
  { tabId: 'tab-6', tabTitle: 'Chapter 3' },
  { tabId: 'tab-7', tabTitle: 'Chapter 4' },
  { tabId: 'tab-8', tabTitle: 'Chapter 5' },
  { tabId: 'tab-9', tabTitle: 'Chapter 6' },
  { tabId: 'tab-10', tabTitle: 'Chapter 7' },
  { tabId: 'tab-11', tabTitle: 'Chapter 8' },
  { tabId: 'tab-12', tabTitle: 'Chapter 9' },
  { tabId: 'tab-13', tabTitle: 'Chapter 10' },
  { tabId: 'tab-14', tabTitle: 'Chapter 11' },
  { tabId: 'tab-15', tabTitle: 'Chapter 12' },
  { tabId: 'tab-16', tabTitle: 'Chapter 13' },
  { tabId: 'tab-17', tabTitle: 'Chapter 14' },
  { tabId: 'tab-18', tabTitle: 'Chapter 15' },
  { tabId: 'tab-19', tabTitle: 'Chapter 16' },
  { tabId: 'tab-20', tabTitle: 'Chapter 17' },
  { tabId: 'tab-21', tabTitle: 'Chapter 18' },
  { tabId: 'tab-22', tabTitle: 'Chapter 19' },
  { tabId: 'tab-23', tabTitle: 'Chapter 20' },
  { tabId: 'tab-24', tabTitle: 'Chapter 21' },
  { tabId: 'tab-25', tabTitle: 'Chapter 22' },
  { tabId: 'tab-26', tabTitle: 'Chapter 23' },
  { tabId: 'tab-27', tabTitle: 'Chapter 24' },
  { tabId: 'tab-28', tabTitle: 'Chapter 25' },
  { tabId: 'tab-29', tabTitle: 'Chapter 26' },
  { tabId: 'tab-30', tabTitle: 'Chapter 27' },
  { tabId: 'tab-31', tabTitle: 'Chapter 28' },
  { tabId: 'tab-32', tabTitle: 'Chapter 29' },
  { tabId: 'tab-33', tabTitle: 'Chapter 30' },
  { tabId: 'tab-34', tabTitle: 'Chapter 31' },
  { tabId: 'tab-35', tabTitle: 'Chapter 32' },
  { tabId: 'tab-36', tabTitle: 'Chapter 33' },
  { tabId: 'tab-37', tabTitle: 'Chapter 34' },
  { tabId: 'tab-38', tabTitle: 'Chapter 35' },
  { tabId: 'tab-39', tabTitle: 'Chapter 36' },
  { tabId: 'tab-40', tabTitle: 'Chapter 37' },
  { tabId: 'tab-41', tabTitle: 'Chapter 38' },
  { tabId: 'tab-42', tabTitle: 'Chapter 39' },
  { tabId: 'tab-43', tabTitle: 'Chapter 40' },
  { tabId: 'tab-44', tabTitle: 'Chapter 41' },
  { tabId: 'tab-45', tabTitle: 'Chapter 42' },
  { tabId: 'tab-46', tabTitle: 'Chapter 43' },
  { tabId: 'tab-47', tabTitle: 'Chapter 44' },
  { tabId: 'tab-48', tabTitle: 'Chapter 45' },
  { tabId: 'tab-49', tabTitle: 'Chapter 46' },
  { tabId: 'tab-50', tabTitle: 'Chapter 47' },
  { tabId: 'tab-51', tabTitle: 'Chapter 48' },
  { tabId: 'tab-52', tabTitle: 'Chapter 49' },
  { tabId: 'tab-53', tabTitle: 'Chapter 50' },
  { tabId: 'tab-54', tabTitle: 'Chapter 51' },
  { tabId: 'tab-55', tabTitle: 'Chapter 52' },
  { tabId: 'tab-56', tabTitle: 'Chapter 53' },
  { tabId: 'tab-57', tabTitle: 'Chapter 54' },
];

export const SelectTabsModal = ({
  sdk,
  isOpen,
  onBack,
  onContinue,
  onClose,
}: SelectTabsModalProps) => {
  const [availableTabs, setAvailableTabs] = useState<DocumentTabProps[]>([]);
  const [selectedTabs, setSelectedTabs] = useState<DocumentTabProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasFetchError, setHasFetchError] = useState<boolean>(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [selectAllTabs, setSelectAllTabs] = useState<boolean>(false);

  const isInvalidSelection = useMemo(
    () => !selectAllTabs && selectedTabs.length === 0,
    [selectAllTabs, selectedTabs]
  );
  const isInvalidSelectionError = useMemo(
    () => isInvalidSelection && hasAttemptedSubmit,
    [isInvalidSelection, hasAttemptedSubmit]
  );

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        setIsLoading(true);
        setHasFetchError(false);
        // TODO: Replace with actual API call to fetch document tabs
        setAvailableTabs(MOCK_TABS);
      } catch (error) {
        console.error('Failed to fetch tabs:', error);
        setHasFetchError(true);
        setAvailableTabs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTabs();
  }, [sdk]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTabs([]);
      setHasAttemptedSubmit(false);
      setSelectAllTabs(false);
    }
  }, [isOpen]);

  const handleSelectTab = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = e.target;
    if (checked) {
      const tab = availableTabs.find((t) => t.tabId === value);
      if (tab) setSelectedTabs((prev) => [...prev, tab]);
    } else {
      setSelectedTabs((prev) => prev.filter((t) => t.tabId !== value));
    }
  };

  const handleBack = () => {
    onBack();
  };

  const handleContinue = () => {
    if (isInvalidSelection) {
      setHasAttemptedSubmit(true);
      return;
    }
    const tabsToUse = selectAllTabs ? availableTabs : selectedTabs;
    onContinue(tabsToUse);
  };

  return (
    <Modal title="Document tabs" isShown={isOpen} onClose={onClose} size="large">
      {() => (
        <>
          <Modal.Header title="Document tabs" onClose={onClose} />
          <Modal.Content>
            <Paragraph marginBottom="spacingM" color="gray700">
              The selected document contains multiple document tabs. Would you like to select which
              tabs should be used from your document? If no, all tabs will be imported.
            </Paragraph>

            <Flex flexDirection="column" gap="spacingS" marginBottom="spacingM">
              <Radio.Group
                name="tab-selection-mode"
                value={String(selectAllTabs)}
                onChange={(e) => setSelectAllTabs(e.target.value === 'true')}>
                <Radio value="false">Yes, select specific tabs</Radio>
                {!selectAllTabs && (
                  <Flex flexDirection="column" gap="spacingS" marginLeft="spacingL" fullWidth>
                    <FormControl
                      isRequired
                      isInvalid={isInvalidSelectionError || hasFetchError}
                      marginBottom="none">
                      <FormControl.Label>Document tabs</FormControl.Label>
                      <Checkbox.Group name="document-tabs" value={selectedTabs.map((t) => t.tabId)}>
                        <Multiselect
                          className={css({ maxWidth: '60%' })}
                          currentSelection={selectedTabs.map((tab) => tab.tabTitle)}
                          placeholder={isLoading ? 'Loading tabs...' : 'Select one or more'}
                          popoverProps={{
                            listMaxHeight: 200,
                          }}>
                          {availableTabs.map((tab) => (
                            <Multiselect.Option
                              className={css({ padding: `0.25rem` })}
                              key={tab.tabId}
                              value={tab.tabId}
                              itemId={tab.tabId}
                              isChecked={selectedTabs.some(
                                (selected) => selected.tabId === tab.tabId
                              )}
                              isDisabled={isLoading}
                              onSelectItem={handleSelectTab}>
                              {tab.tabTitle}
                            </Multiselect.Option>
                          ))}
                        </Multiselect>
                      </Checkbox.Group>
                      {hasFetchError && (
                        <FormControl.ValidationMessage>
                          Unable to load document tabs.
                        </FormControl.ValidationMessage>
                      )}
                      {isInvalidSelectionError && (
                        <FormControl.ValidationMessage>
                          You must select at least one tab.
                        </FormControl.ValidationMessage>
                      )}
                    </FormControl>
                    {selectedTabs.length > 0 && (
                      <Flex
                        flexWrap="wrap"
                        gap="spacingXs"
                        className={css({
                          maxHeight: '120px',
                          overflowY: 'auto',
                        })}>
                        {selectedTabs.map((tab) => (
                          <Pill
                            key={tab.tabId}
                            label={tab.tabTitle}
                            onClose={() =>
                              setSelectedTabs((prev) => prev.filter((t) => t.tabId !== tab.tabId))
                            }
                          />
                        ))}
                      </Flex>
                    )}
                  </Flex>
                )}
                <Radio value="true">No, import all tabs</Radio>
              </Radio.Group>
            </Flex>
          </Modal.Content>
          <Modal.Controls style={{ paddingTop: '0' }}>
            <Button onClick={handleBack} variant="secondary">
              Back
            </Button>
            <Button
              onClick={handleContinue}
              variant="primary"
              isDisabled={isLoading}
              isLoading={isLoading}>
              Next
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
