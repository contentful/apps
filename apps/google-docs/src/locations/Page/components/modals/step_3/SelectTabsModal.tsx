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
import {
  formWrapper,
  modalControls,
  multiselect,
  multiselectOption,
  pillsContainer,
} from './SelectTabsModal.styles';

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

const TRUNCATE_LENGTH = 10;

const truncateLabel = (label: string, maxLength: number = TRUNCATE_LENGTH): string =>
  label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;

const MOCK_TABS: DocumentTabProps[] = [
  { tabId: 'tab-1', tabTitle: 'Introduction' },
  { tabId: 'tab-2', tabTitle: 'Chapter 1' },
  { tabId: 'tab-3', tabTitle: 'Chapter 2' },
  { tabId: 'tab-4', tabTitle: 'Appendix' },
  { tabId: 'tab-5', tabTitle: 'References' },
  { tabId: 'tab-6', tabTitle: 'Chapter 3' },
  { tabId: 'tab-7', tabTitle: 'Chapter 4' },
  { tabId: 'tab-8', tabTitle: 'Long long label 1' },
  { tabId: 'tab-9', tabTitle: 'Chapter 6' },
  { tabId: 'tab-10', tabTitle: 'Chapter 7' },
  { tabId: 'tab-11', tabTitle: 'Chapter 8' },
  { tabId: 'tab-12', tabTitle: 'Chapter 9' },
  { tabId: 'tab-13', tabTitle: 'Long long label 2' },
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
                  <Flex
                    flexDirection="column"
                    gap="spacingS"
                    marginLeft="spacingL"
                    fullWidth
                    className={formWrapper}>
                    <FormControl
                      isRequired
                      isInvalid={isInvalidSelectionError || hasFetchError}
                      marginBottom="none">
                      <FormControl.Label>Document tabs</FormControl.Label>
                      <Checkbox.Group name="document-tabs" value={selectedTabs.map((t) => t.tabId)}>
                        <Multiselect
                          className={multiselect}
                          currentSelection={selectedTabs.map((tab) => tab.tabTitle)}
                          placeholder={isLoading ? 'Loading tabs...' : 'Select one or more'}
                          popoverProps={{
                            listMaxHeight: 300,
                          }}>
                          {availableTabs.map((tab) => (
                            <Multiselect.Option
                              className={multiselectOption}
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
                      <Flex flexWrap="wrap" gap="spacingXs" className={pillsContainer}>
                        {selectedTabs.map((tab) => (
                          <Pill
                            key={tab.tabId}
                            label={truncateLabel(tab.tabTitle)}
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
          <Modal.Controls className={modalControls}>
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
