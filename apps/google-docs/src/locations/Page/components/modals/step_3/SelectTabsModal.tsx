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
import {
  modalControls,
  multiselect,
  multiselectOption,
  pillsContainer,
} from './SelectTabsModal.styles';
import { useMultiselectScrollReflow } from '../../../../../hooks/useMultiselectReflow';
import { DocumentTabProps } from '../../../../../utils/types';
import { truncateLabel } from '../../../../../utils/utils';

interface SelectTabsModalProps {
  isOpen: boolean;
  onContinue: (selectedTabs: DocumentTabProps[]) => void;
  onClose: () => void;
  availableTabs: DocumentTabProps[];
  setAvailableTabs: React.Dispatch<React.SetStateAction<DocumentTabProps[]>>;
  selectedTabs: DocumentTabProps[];
  setSelectedTabs: React.Dispatch<React.SetStateAction<DocumentTabProps[]>>;
}

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
  isOpen,
  onContinue,
  onClose,
  availableTabs,
  setAvailableTabs,
  selectedTabs,
  setSelectedTabs,
}: SelectTabsModalProps) => {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [useAllTabs, setUseAllTabs] = useState<boolean | null>(null);
  const multiselectListRef = useMultiselectScrollReflow(selectedTabs);

  const isInvalidSelection = useMemo(
    () => useAllTabs === null || (useAllTabs === false && selectedTabs.length === 0),
    [useAllTabs, selectedTabs]
  );
  const hasNoRadioSelected = useAllTabs === null;
  const isInvalidSelectionError = useMemo(
    () => isInvalidSelection && hasAttemptedSubmit,
    [isInvalidSelection, hasAttemptedSubmit]
  );
  const showNoRadioSelectedError = hasNoRadioSelected && hasAttemptedSubmit;

  useEffect(() => {
    if (isOpen) {
      setAvailableTabs(MOCK_TABS);
      setSelectedTabs([]);
      setHasAttemptedSubmit(false);
      setUseAllTabs(null);
    }
  }, [isOpen, setAvailableTabs, setSelectedTabs]);

  const handleSelectTab = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasAttemptedSubmit(false);

    const { checked, value } = e.target;
    if (checked) {
      const tab = availableTabs.find((t) => t.tabId === value);
      if (tab) setSelectedTabs((prev) => [...prev, tab]);
    } else {
      setSelectedTabs((prev) => prev.filter((t) => t.tabId !== value));
    }
  };

  const handleContinue = () => {
    if (isInvalidSelection) {
      setHasAttemptedSubmit(true);
      return;
    }
    const tabsToUse = useAllTabs ? availableTabs : selectedTabs;
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
                value={useAllTabs === null ? '' : String(useAllTabs)}
                onChange={(e) => setUseAllTabs(e.target.value === 'true')}>
                <Radio value="false">Yes, select specific tabs</Radio>
                {useAllTabs === false && (
                  <Flex flexDirection="column" gap="spacingS" marginLeft="spacingL" fullWidth>
                    <FormControl isRequired isInvalid={isInvalidSelectionError} marginBottom="none">
                      <FormControl.Label>Document tabs</FormControl.Label>
                      <Checkbox.Group name="document-tabs" value={selectedTabs.map((t) => t.tabId)}>
                        <Multiselect
                          className={multiselect}
                          currentSelection={selectedTabs.map((tab) => tab.tabTitle)}
                          placeholder={'Select one or more'}
                          popoverProps={{
                            listMaxHeight: 300,
                            listRef: multiselectListRef,
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
                              onSelectItem={handleSelectTab}>
                              {tab.tabTitle}
                            </Multiselect.Option>
                          ))}
                        </Multiselect>
                      </Checkbox.Group>
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
              {showNoRadioSelectedError && (
                <FormControl.ValidationMessage>
                  Please select an option.
                </FormControl.ValidationMessage>
              )}
            </Flex>
          </Modal.Content>
          <Modal.Controls className={modalControls}>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleContinue} variant="primary">
              Next
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};
