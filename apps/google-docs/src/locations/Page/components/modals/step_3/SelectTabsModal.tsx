import { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Flex,
  FormControl,
  Modal,
  Paragraph,
  Pill,
  Multiselect,
} from '@contentful/f36-components';
import { PageAppSDK } from '@contentful/app-sdk';
import { css } from '@emotion/css';

interface SelectTabsModalProps {
  sdk: PageAppSDK;
  isOpen: boolean;
  onBack: () => void;
  onContinue: () => void;
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

  const isInvalidSelection = useMemo(() => selectedTabs.length === 0, [selectedTabs]);
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
    onContinue();
  };

  return (
    <Modal title="Select document tab(s)" isShown={isOpen} onClose={onClose} size="large">
      {() => (
        <>
          <Modal.Header title="Select document tab(s)" onClose={onClose} />
          <Modal.Content className={css({ minHeight: '300px' })}>
            <Paragraph marginBottom="spacingM" color="gray700">
              The selected document contains multiple document tabs. Please choose the specific tabs
              you want to use to create entries.
            </Paragraph>
            <FormControl isRequired isInvalid={isInvalidSelectionError || hasFetchError}>
              <FormControl.Label>Document tabs</FormControl.Label>
              <Multiselect
                currentSelection={selectedTabs.map((tab) => tab.tabTitle)}
                placeholder={isLoading ? 'Loading tabs...' : 'Select one or more'}
                popoverProps={{ isFullWidth: true, listMaxHeight: 150 }}>
                {availableTabs.map((tab) => (
                  <Multiselect.Option
                    className={css({ padding: `0.25rem` })}
                    key={tab.tabId}
                    value={tab.tabId}
                    itemId={tab.tabId}
                    isChecked={selectedTabs.some((selected) => selected.tabId === tab.tabId)}
                    isDisabled={isLoading}
                    onSelectItem={handleSelectTab}>
                    {tab.tabTitle}
                  </Multiselect.Option>
                ))}
              </Multiselect>
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
              <Flex flexWrap="wrap" gap="spacingXs" marginTop="spacingS">
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
          </Modal.Content>
          <Modal.Controls>
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
